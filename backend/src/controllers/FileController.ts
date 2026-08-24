import { Elysia, t } from "elysia";
import { Readable } from "stream";
import { FileService } from "../services/FileService";
import { TokenService } from "../services/TokenService";
import { config } from "../config";

const serializeFile = (f: { size: bigint | number; [key: string]: unknown }) => ({
  ...f,
  size: Number(f.size),
});

// Header values are Latin-1 only; clients encodeURIComponent non-ASCII names.
// Fall back to the raw value if it wasn't encoded (older clients).
const safeDecodeHeader = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const fileController = (
  fileService: FileService,
  tokenService: TokenService,
  publish: (topic: string, data: string) => void
) =>
  new Elysia({ prefix: "/files" })
    .get("/", async ({ query }) => {
      const folderId = query.folderId === "root" ? null : query.folderId;
      const files = await fileService.getAllFiles(folderId);
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
          body.uploaderName,
          body.folderId,
        ));
        publish("files", JSON.stringify({ type: "FILE_UPDATED", data: updatedFile }));
        return updatedFile;
      },
      {
        body: t.Object({
          originalName: t.Optional(t.String()),
          uploaderName: t.Optional(t.String()),
          folderId: t.Optional(t.Union([t.String(), t.Null()])),
        }),
      }
    )
    .post("/upload/stream", async ({ request, set }) => {
      const fileName = safeDecodeHeader(request.headers.get("x-file-name") || "upload");
      const mimeType = request.headers.get("content-type") || "application/octet-stream";
      const uploaderNameRaw = request.headers.get("x-uploader-name") || "";
      const uploaderName = safeDecodeHeader(uploaderNameRaw) || undefined;
      const folderId = request.headers.get("x-folder-id") || undefined;

      if (!request.body) {
        set.status = 400;
        return { error: "No body" };
      }

      // Fast-path rejection based on the declared size; the streamed byte
      // count is enforced again in streamUpload for lying clients.
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 5 * 1024 * 1024 * 1024) {
        set.status = 413;
        return { error: "File exceeds 5 GB limit" };
      }

      const ext = fileName.split(".").pop() || "";
      const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;

      let nodeStream: NodeJS.ReadableStream;
      try {
        nodeStream = Readable.fromWeb(request.body as Parameters<typeof Readable.fromWeb>[0]);
      } catch {
        set.status = 400;
        return { error: "Invalid request body" };
      }

      try {
        const newFile = serializeFile(
          await fileService.streamUpload({
            objectKey,
            source: nodeStream,
            originalName: fileName,
            mimeType,
            uploaderName,
            folderId,
          }),
        );
        publish("files", JSON.stringify({ type: "FILE_ADDED", data: newFile }));

        return newFile;
      } catch (error) {
        if (error instanceof Error && error.message === "File exceeds 5 GB limit") {
          set.status = 413;
          return { error: error.message };
        }
        throw error;
      }
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
          body.folderId,
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
          folderId: t.Optional(t.String()),
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
    // Streams file content with Range support (video seek, resumable downloads).
    // Content-Disposition stays `attachment`: anchor-click downloads need it and
    // embedded <img>/<video> ignore it.
    .get("/:id/content", async ({ params, query, request, set }) => {
      const { token } = query;
      if (!tokenService.verifyToken(token as string, params.id)) {
        set.status = 401;
        return { error: "Invalid or expired token" };
      }

      const info = await fileService.getFileInfo(params.id);
      if (!info) {
        set.status = 404;
        return { error: "File not found or content missing" };
      }
      const { file, size: totalSize } = info;

      // toWebStream with cancel → destroy so aborted requests stop the transfer.
      const toWebStream = (nodeStream: NodeJS.ReadableStream) =>
        new ReadableStream({
          start(controller) {
            nodeStream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
            nodeStream.on("end", () => controller.close());
            nodeStream.on("error", (err) => controller.error(err));
          },
          cancel() {
            (nodeStream as import("stream").Readable).destroy();
          },
        });

      const baseHeaders: Record<string, string> = {
        "Content-Type": file.mimeType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      };

      const rangeHeader = request.headers.get("range");
      const rangeMatch = rangeHeader?.match(/^bytes=(\d*)-(\d*)$/);
      if (rangeMatch && (rangeMatch[1] !== "" || rangeMatch[2] !== "")) {
        let start: number;
        let end: number;

        if (rangeMatch[1] === "") {
          // Suffix form: bytes=-N → last N bytes
          const suffix = parseInt(rangeMatch[2]!);
          start = Math.max(0, totalSize - suffix);
          end = totalSize - 1;
        } else {
          start = parseInt(rangeMatch[1]!);
          end = rangeMatch[2] === "" ? totalSize - 1 : Math.min(parseInt(rangeMatch[2]!), totalSize - 1);
        }

        if (start >= totalSize || start > end) {
          set.status = 416;
          set.headers["Content-Range"] = `bytes */${totalSize}`;
          return { error: "Requested range not satisfiable" };
        }

        const length = end - start + 1;
        const nodeStream = await fileService.getObjectRange(file.objectKey, start, length);

        return new Response(toWebStream(nodeStream), {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Content-Length": String(length),
          },
        });
      }

      const nodeStream = await fileService.getObjectStream(file.objectKey);
      return new Response(toWebStream(nodeStream), {
        headers: { ...baseHeaders, "Content-Length": String(totalSize) },
      });
    });
