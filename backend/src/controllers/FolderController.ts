import { Elysia, t } from "elysia";
import { FolderService } from "../services/FolderService";

export const folderController = (folderService: FolderService) =>
  new Elysia({ prefix: "/folders" })
    .get("/", async ({ query }) => {
      const parentId = query.parentId === "root" ? null : query.parentId;
      return folderService.getFolders(parentId);
    })
    .post(
      "/",
      async ({ body }) => {
        return folderService.createFolder(body.name, body.parentId, body.createdBy);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          parentId: t.Optional(t.String()),
          createdBy: t.Optional(t.String()),
        }),
      },
    )
    .get("/:id/breadcrumb", async ({ params, set }) => {
      const crumbs = await folderService.getBreadcrumb(params.id);
      if (!crumbs.length) {
        set.status = 404;
        return { error: "Folder not found" };
      }
      return crumbs;
    })
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        const folder = await folderService.getFolderById(params.id);
        if (!folder) {
          set.status = 404;
          return { error: "Folder not found" };
        }
        return folderService.renameFolder(params.id, body.name);
      },
      {
        body: t.Object({ name: t.String({ minLength: 1 }) }),
      },
    )
    .delete("/:id", async ({ params }) => {
      await folderService.deleteFolder(params.id);
      return { success: true };
    });
