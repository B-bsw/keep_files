import { existsSync, mkdirSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "../db";
import { config } from "../config";

export class FileService {
  constructor() {
    if (!existsSync(config.uploadDir)) {
      mkdirSync(config.uploadDir, { recursive: true });
    }
  }

  public async getAllFiles() {
    return prisma.file.findMany({
      orderBy: { uploadDate: "desc" },
    });
  }

  public async getFileById(id: string) {
    return prisma.file.findUnique({ where: { id } });
  }

  public async saveFile(file: globalThis.File, uploaderName?: string) {
    const originalName = file.name;
    const mimeType = file.type;
    const size = file.size;

    const ext = originalName.split(".").pop() || "";
    const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;
    const filePath = path.join(config.uploadDir, objectKey);

    await Bun.write(filePath, file);

    return prisma.file.create({
      data: {
        originalName,
        objectKey,
        size,
        mimeType,
        uploaderName: uploaderName || null,
      },
    });
  }

  public async deleteFile(id: string) {
    const file = await this.getFileById(id);
    if (!file) throw new Error("File not found");

    const filePath = path.join(config.uploadDir, file.objectKey);
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error("Error deleting local file:", error);
    }

    await prisma.file.delete({ where: { id } });
    return true;
  }

  public async updateFile(id: string, originalName?: string, uploaderName?: string) {
    const file = await this.getFileById(id);
    if (!file) throw new Error("File not found");

    let finalOriginalName = originalName;
    if (originalName) {
      const extMatch = file.originalName.match(/\.[^.]+$/);
      if (extMatch) {
        const ext = extMatch[0];
        if (!originalName.endsWith(ext)) {
          finalOriginalName = `${originalName}${ext}`;
        }
      }
    }

    return prisma.file.update({
      where: { id },
      data: {
        ...(originalName && { originalName: finalOriginalName }),
        ...(uploaderName !== undefined && { uploaderName }),
        uploadDate: new Date(),
      },
    });
  }
}
