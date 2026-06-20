import { Elysia, t } from "elysia";
import { FileService } from "../services/FileService";
import { TokenService } from "../services/TokenService";
import { config } from "../config";

const serializeFile = (f: { size: bigint | number; [key: string]: unknown }) => ({
  ...f,
  size: Number(f.size),
});

export const fileController = (
  fileService: FileService,
  tokenService: TokenService,
  publish: (topic: string, data: string) => void
) =>
  new Elysia({ prefix: "/files" })
    .get("/", async () => {
      const files = await fileService.getAllFiles();
      return files.map(serializeFile);
    })
    .post(
      "/upload",
      async ({ body }) => {
        const file = body.file as globalThis.File;
        const uploaderName = body.uploaderName as string | undefined;

        if (!file) throw new Error("No file uploaded");

        const newFile = serializeFile(await fileService.saveFile(file, uploaderName));
        publish("files", JSON.stringify({ type: "FILE_ADDED", data: newFile }));

        return newFile;
      },
      {
        body: t.Object({
          file: t.File(),
          uploaderName: t.Optional(t.String()),
        }),
      }
    )
    .delete("/:id", async ({ params }) => {
      await fileService.deleteFile(params.id);
      publish("files", JSON.stringify({ type: "FILE_DELETED", data: { id: params.id } }));
      return { success: true, message: "File deleted successfully" };
    })
    .patch(
      "/:id",
      async ({ params, body }) => {
        const updatedFile = serializeFile(await fileService.updateFile(
          params.id,
          body.originalName,
          body.uploaderName
        ));
        publish("files", JSON.stringify({ type: "FILE_UPDATED", data: updatedFile }));
        return updatedFile;
      },
      {
        body: t.Object({
          originalName: t.Optional(t.String()),
          uploaderName: t.Optional(t.String()),
        }),
      }
    )
    .post("/upload/stream", async ({ request, set }) => {
      const fileName = decodeURIComponent(request.headers.get("x-file-name") || "upload");
      const mimeType = request.headers.get("content-type") || "application/octet-stream";
      const uploaderName = request.headers.get("x-uploader-name") || undefined;

      if (!request.body) {
        set.status = 400;
        return { error: "No body" };
      }

      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 5 * 1024 * 1024 * 1024) {
        set.status = 413;
        return { error: "File exceeds 5 GB limit" };
      }

      const ext = fileName.split(".").pop() || "";
      const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;

      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
        size += chunk.byteLength;
      }
      const buffer = Buffer.concat(chunks);

      const newFile = serializeFile(await fileService.streamUpload({
        objectKey,
        buffer,
        size,
        originalName: fileName,
        mimeType,
        uploaderName,
      }));
      publish("files", JSON.stringify({ type: "FILE_ADDED", data: newFile }));

      return newFile;
    })
    // Resumable upload session routes
    .post(
      "/upload/session",
      async ({ body }) => {
        const session = await fileService.createUploadSession(
          body.fileName,
          body.mimeType,
          body.totalSize,
          body.uploaderName,
        );
        return {
          sessionId: session.id,
          objectKey: session.objectKey,
          uploadedSize: Number(session.uploadedSize),
        };
      },
      {
        body: t.Object({
          fileName: t.String(),
          mimeType: t.String(),
          totalSize: t.Number(),
          uploaderName: t.Optional(t.String()),
        }),
      },
    )
    .delete("/upload/session/:sessionId", async ({ params }) => {
      await fileService.cancelUploadSession(params.sessionId);
      return { success: true };
    })
    .get("/upload/session/:sessionId", async ({ params, set }) => {
      const session = await fileService.getUploadSession(params.sessionId);
      if (!session) {
        set.status = 404;
        return { error: "Session not found" };
      }
      return { uploadedSize: Number(session.uploadedSize), totalSize: Number(session.totalSize) };
    })
    .put("/upload/session/:sessionId", async ({ params, request, set }) => {
      const contentRange = request.headers.get("Content-Range");
      if (!contentRange) {
        set.status = 400;
        return { error: "Content-Range header required" };
      }

      // Content-Range: bytes 0-8388607/104857600
      const match = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
      if (!match) {
        set.status = 400;
        return { error: "Invalid Content-Range format" };
      }
      const rangeStart = parseInt(match[1]!);

      const chunk = new Uint8Array(await request.arrayBuffer());
      const result = await fileService.appendChunk(params.sessionId, chunk, rangeStart);

      if (result.done && "file" in result && result.file) {
        const file = serializeFile(result.file);
        publish("files", JSON.stringify({ type: "FILE_ADDED", data: file }));
        return { done: true, file };
      }

      return result;
    })
    .post("/:id/request-access", async ({ params, set }) => {
      const file = await fileService.getFileById(params.id);
      if (!file) {
        set.status = 404;
        return { error: "File not found" };
      }

      const token = tokenService.createToken(params.id);
      const downloadUrl = `${config.publicApiUrl}/files/${file.id}/content?token=${token}`;
      return { token, url: downloadUrl };
    })
    .get("/:id/download", async ({ set }) => {
      set.status = 403;
      return { error: "Please request access with a password first" };
    })
    .get("/:id/content", async ({ params, query, set }) => {
      const { token } = query;
      if (!tokenService.verifyToken(token as string, params.id)) {
        set.status = 401;
        return { error: "Invalid or expired token" };
      }

      const file = await fileService.getFileById(params.id);
      if (!file) {
        set.status = 404;
        return { error: "File not found" };
      }

      const exists = await fileService.objectExists(file.objectKey);
      if (!exists) {
        set.status = 404;
        return { error: "File content not found" };
      }

      const nodeStream = await fileService.getObjectStream(file.objectKey);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
      });

      return new Response(webStream, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          "Content-Type": file.mimeType,
        },
      });
    });
