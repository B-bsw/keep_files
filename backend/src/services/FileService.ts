import { existsSync, mkdirSync } from "fs";
import { unlink, rename, open } from "fs/promises";
import path from "path";
import { prisma } from "../db";
import { config } from "../config";

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB

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

  public async cancelUploadSession(sessionId: string) {
    const session = await this.getUploadSession(sessionId);
    if (!session) return;
    const tempPath = path.join(config.uploadDir, `tmp_${session.objectKey}`);
    try {
      if (existsSync(tempPath)) await unlink(tempPath);
    } catch {}
    await prisma.uploadSession.delete({ where: { id: sessionId } });
  }

  public async saveFileRecord({ originalName, objectKey, size, mimeType, uploaderName }: {
    originalName: string;
    objectKey: string;
    size: number;
    mimeType: string;
    uploaderName?: string;
  }) {
    return prisma.file.create({
      data: { originalName, objectKey, size: BigInt(size), mimeType, uploaderName: uploaderName || null },
    });
  }

  public async createUploadSession(
    fileName: string,
    mimeType: string,
    totalSize: number,
    uploaderName?: string,
  ) {
    const ext = fileName.split(".").pop() || "";
    const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    return prisma.uploadSession.create({
      data: {
        fileName,
        mimeType,
        totalSize: BigInt(totalSize),
        objectKey,
        uploaderName: uploaderName || null,
        expiresAt,
      },
    });
  }

  public async getUploadSession(sessionId: string) {
    return prisma.uploadSession.findUnique({ where: { id: sessionId } });
  }

  public async appendChunk(sessionId: string, chunk: Uint8Array, rangeStart: number) {
    const session = await this.getUploadSession(sessionId);
    if (!session) throw new Error("Upload session not found");

    const tempPath = path.join(config.uploadDir, `tmp_${session.objectKey}`);

    // Write chunk at exact offset
    const fd = await open(tempPath, "r+").catch(async () => {
      // File doesn't exist yet — create it by writing a placeholder
      const f = await open(tempPath, "w");
      await f.close();
      return open(tempPath, "r+");
    });
    await fd.write(chunk, 0, chunk.length, rangeStart);
    await fd.close();

    const newUploaded = rangeStart + chunk.length;
    const updated = await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { uploadedSize: BigInt(newUploaded) },
    });

    // Finalize if complete
    if (newUploaded >= Number(session.totalSize)) {
      return this.finalizeSession(session);
    }

    return { done: false, uploadedSize: newUploaded };
  }

  private async finalizeSession(session: { id: string; objectKey: string; fileName: string; mimeType: string; totalSize: bigint; uploaderName: string | null }) {
    const tempPath = path.join(config.uploadDir, `tmp_${session.objectKey}`);
    const finalPath = path.join(config.uploadDir, session.objectKey);

    await rename(tempPath, finalPath);

    const newFile = await prisma.file.create({
      data: {
        originalName: session.fileName,
        objectKey: session.objectKey,
        size: session.totalSize,
        mimeType: session.mimeType,
        uploaderName: session.uploaderName,
      },
    });

    await prisma.uploadSession.delete({ where: { id: session.id } });

    return { done: true, file: newFile };
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
