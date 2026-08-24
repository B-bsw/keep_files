import { Elysia, t } from "elysia";
import { ShareService } from "../services/ShareService";
import { FileService } from "../services/FileService";
import { TokenService } from "../services/TokenService";
import { config } from "../config";

// Whitelisted public shapes — never expose internal fields like objectKey.
const serializeFilePublic = (f: {
  id: string;
  originalName: string;
  size: bigint | number;
  mimeType: string;
  uploadDate: Date;
  uploaderName: string | null;
}) => ({
  id: f.id,
  originalName: f.originalName,
  size: Number(f.size),
  mimeType: f.mimeType,
  uploadDate: f.uploadDate,
  uploaderName: f.uploaderName,
});

// Node → Web stream bridge so aborted requests stop the transfer.
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

export const shareController = (
  shareService: ShareService,
  fileService: FileService,
  tokenService: TokenService,
) =>
  new Elysia({ prefix: "/share" })
    // Public route — get share link info (file or folder listing)
    .get("/:token", async ({ params, set }) => {
      const link = await shareService.getShareLink(params.token);
      if (!link) {
        set.status = 404;
        return { error: "Share link not found or expired" };
      }

      if (link.file) {
        return {
          type: "file",
          permission: link.permission,
          file: serializeFilePublic(link.file),
        };
      }

      if (link.folder) {
        return {
          type: "folder",
          permission: link.permission,
          folder: {
            id: link.folder.id,
            name: link.folder.name,
            createdAt: link.folder.createdAt,
          },
          files: link.folder.files.map(serializeFilePublic),
        };
      }

      set.status = 404;
      return { error: "Shared resource not found" };
    })
    // Public route — get download token for shared content
    .post(
      "/:token/access",
      async ({ params, query, set }) => {
        const link = await shareService.getShareLink(params.token);
        if (!link) {
          set.status = 404;
          return { error: "Share link not found or expired" };
        }

        // Enforce the permission — VIEW links must never yield download URLs.
        if (link.permission !== "DOWNLOAD") {
          set.status = 403;
          return { error: "This share link allows viewing only" };
        }

        const issueUrl = (fileId: string) => {
          const downloadToken = tokenService.createToken(fileId);
          return {
            token: downloadToken,
            url: `${config.publicApiUrl}/files/${fileId}/content?token=${downloadToken}`,
          };
        };

        if (link.file) {
          return issueUrl(link.file.id);
        }

        if (link.folder) {
          // Folder share: a specific file inside the linked folder is requested.
          const fileId = query.fileId;
          if (!fileId) {
            set.status = 400;
            return { error: "fileId query parameter required for folder shares" };
          }
          const file = await fileService.getFileById(fileId);
          if (!file || file.folderId !== link.folder.id) {
            set.status = 404;
            return { error: "File not found in this shared folder" };
          }
          return issueUrl(file.id);
        }

        set.status = 400;
        return { error: "This share link is not for downloadable content" };
      },
      {
        query: t.Object({
          fileId: t.Optional(t.String()),
        }),
      },
    )
    // Public route — inline image preview. Works for both VIEW and DOWNLOAD
    // links; unlike /access it never issues a reusable download token, so
    // VIEW links still can't hand out URLs for the content endpoint.
    .get(
      "/:token/preview",
      async ({ params, query, set }) => {
        const link = await shareService.getShareLink(params.token);
        if (!link) {
          set.status = 404;
          return { error: "Share link not found or expired" };
        }

        let target: { id: string; originalName: string; mimeType: string } | null = null;
        if (link.file) {
          target = link.file;
        } else if (link.folder) {
          const fileId = query.fileId;
          if (!fileId) {
            set.status = 400;
            return { error: "fileId query parameter required for folder shares" };
          }
          const candidate = await fileService.getFileById(fileId);
          if (!candidate || candidate.folderId !== link.folder.id) {
            set.status = 404;
            return { error: "File not found in this shared folder" };
          }
          target = candidate;
        }

        if (!target) {
          set.status = 404;
          return { error: "Shared resource not found" };
        }

        if (!target.mimeType.startsWith("image/")) {
          set.status = 415;
          return { error: "Preview is only available for images" };
        }

        const info = await fileService.getFileInfo(target.id);
        if (!info) {
          set.status = 404;
          return { error: "File content missing" };
        }

        set.headers["Content-Type"] = info.file.mimeType;
        set.headers["Content-Length"] = String(info.size);
        set.headers["Cache-Control"] = "private, max-age=60";
        set.headers["Content-Disposition"] = `inline; filename="${encodeURIComponent(info.file.originalName)}"`;
        return toWebStream(await fileService.getObjectStream(info.file.objectKey));
      },
      {
        query: t.Object({
          fileId: t.Optional(t.String()),
        }),
      },
    )
    // Authenticated — create share link
    .post(
      "/",
      async ({ body }) => {
        const link = await shareService.createShareLink({
          fileId: body.fileId,
          folderId: body.folderId,
          permission: body.permission as "VIEW" | "DOWNLOAD",
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        });
        return link;
      },
      {
        body: t.Object({
          fileId: t.Optional(t.String()),
          folderId: t.Optional(t.String()),
          permission: t.Union([t.Literal("VIEW"), t.Literal("DOWNLOAD")]),
          expiresAt: t.Optional(t.String()),
        }),
      },
    )
    // Authenticated — list share links for a file
    .get("/file/:fileId", async ({ params }) => {
      return shareService.listShareLinksForFile(params.fileId);
    })
    // Authenticated — list share links for a folder
    .get("/folder/:folderId", async ({ params }) => {
      return shareService.listShareLinksForFolder(params.folderId);
    })
    // Authenticated — delete share link
    .delete("/:id", async ({ params }) => {
      await shareService.deleteShareLink(params.id);
      return { success: true };
    });
