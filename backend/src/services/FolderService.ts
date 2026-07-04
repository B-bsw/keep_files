import { prisma } from "../db";

export class FolderService {
  public async getFolders(parentId?: string | null) {
    return prisma.folder.findMany({
      where: { parentId: parentId ?? null },
      orderBy: { name: "asc" },
    });
  }

  public async getFolderById(id: string) {
    return prisma.folder.findUnique({ where: { id } });
  }

  public async createFolder(name: string, parentId?: string, createdBy?: string) {
    return prisma.folder.create({
      data: { name, parentId: parentId || null, createdBy: createdBy || null },
    });
  }

  public async renameFolder(id: string, name: string) {
    return prisma.folder.update({ where: { id }, data: { name } });
  }

  public async deleteFolder(id: string) {
    // Move all files in folder back to root before deleting
    await prisma.file.updateMany({ where: { folderId: id }, data: { folderId: null } });
    // Recursively handle children
    const children = await prisma.folder.findMany({ where: { parentId: id } });
    for (const child of children) {
      await this.deleteFolder(child.id);
    }
    await prisma.folder.delete({ where: { id } });
  }

  public async getBreadcrumb(folderId: string): Promise<Array<{ id: string; name: string }>> {
    const crumbs: Array<{ id: string; name: string }> = [];
    let current = await this.getFolderById(folderId);
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      if (!current.parentId) break;
      current = await this.getFolderById(current.parentId);
    }
    return crumbs;
  }
}
