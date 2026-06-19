import { Elysia, t } from "elysia";
import { FileService } from "../services/FileService";
import { TokenService } from "../services/TokenService";
import { config } from "../config";
import path from "path";
import { existsSync } from "fs";

export const fileController = (
  fileService: FileService,
  tokenService: TokenService,
  publish: (topic: string, data: string) => void
) =>
  new Elysia({ prefix: "/files" })
    .get("/", async () => {
      return fileService.getAllFiles();
    })
    .post(
      "/upload",
      async ({ body }) => {
        const file = body.file as globalThis.File;
        const uploaderName = body.uploaderName as string | undefined;

        if (!file) throw new Error("No file uploaded");

        const newFile = await fileService.saveFile(file, uploaderName);
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
        const updatedFile = await fileService.updateFile(
          params.id,
          body.originalName,
          body.uploaderName
        );
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

      const filePath = path.join(config.uploadDir, file.objectKey);
      if (!existsSync(filePath)) {
        set.status = 404;
        return { error: "File physical content not found" };
      }

      set.headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(file.originalName)}"`;
      set.headers["Content-Type"] = file.mimeType;

      return Bun.file(filePath);
    });
