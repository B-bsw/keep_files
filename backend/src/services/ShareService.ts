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
    return link;
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
