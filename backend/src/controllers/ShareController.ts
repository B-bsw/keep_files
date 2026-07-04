import { Elysia, t } from "elysia";
import { ShareService } from "../services/ShareService";
import { FileService } from "../services/FileService";
import { TokenService } from "../services/TokenService";
import { config } from "../config";

export const shareController = (
  shareService: ShareService,
  fileService: FileService,
  tokenService: TokenService,
) =>
  new Elysia({ prefix: "/share" })
    // Public route — get share link info + content access
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
          file: { ...link.file, size: Number(link.file.size) },
        };
      }

      set.status = 404;
      return { error: "Shared resource not found" };
    })
    // Public route — get download token for shared file
    .post("/:token/access", async ({ params, set }) => {
      const link = await shareService.getShareLink(params.token);
      if (!link) {
        set.status = 404;
        return { error: "Share link not found or expired" };
      }
      if (!link.file) {
        set.status = 400;
        return { error: "This share link is not for a file" };
      }

      const token = tokenService.createToken(link.file.id);
      const url = `${config.publicApiUrl}/files/${link.file.id}/content?token=${token}`;
      return { url };
    })
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
