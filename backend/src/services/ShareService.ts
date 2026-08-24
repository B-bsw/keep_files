import { prisma } from "../db";

export class ShareService {
  public async createShareLink({
    fileId,
    folderId,
    permission,
    expiresAt,
  }: {
    fileId?: string;
    folderId?: string;
    permission: "VIEW" | "DOWNLOAD";
    expiresAt?: Date;
  }) {
    return prisma.shareLink.create({
      data: {
        fileId: fileId || null,
        folderId: folderId || null,
        permission,
        expiresAt: expiresAt || null,
      },
    });
  }

  public async getShareLink(token: string) {
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true },
    });
    if (!link) return null;
    if (link.expiresAt && link.expiresAt < new Date()) return null;

    // Folder shares: resolve the folder + its files manually (ShareLink.folderId
    // is intentionally relation-less in the schema, so no FK cascade concerns).
    // Every branch includes `folder` so callers can narrow on it directly.
    if (!link.file && link.folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: link.folderId },
        include: { files: { orderBy: { uploadDate: "desc" } } },
      });
      if (!folder) return null;
      return { ...link, folder };
    }

    return { ...link, folder: null };
  }

  public async listShareLinksForFile(fileId: string) {
    return prisma.shareLink.findMany({ where: { fileId }, orderBy: { createdAt: "desc" } });
  }

  public async listShareLinksForFolder(folderId: string) {
    return prisma.shareLink.findMany({ where: { folderId }, orderBy: { createdAt: "desc" } });
  }

  public async deleteShareLink(id: string) {
    await prisma.shareLink.delete({ where: { id } });
  }
}
