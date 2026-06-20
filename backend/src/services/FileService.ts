import { prisma } from "../db";
import { minioService } from "./MinioService";

export class FileService {
  constructor() {
    minioService.ensureBucket().catch(console.error);
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

    const buffer = Buffer.from(await file.arrayBuffer());
    await minioService.putObject(objectKey, buffer, size, mimeType);

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

    try {
      await minioService.removeObject(file.objectKey);
    } catch (error) {
      console.error("Error deleting object from MinIO:", error);
    }

    await prisma.file.delete({ where: { id } });
    return true;
  }

  public async cancelUploadSession(sessionId: string) {
    const session = await this.getUploadSession(sessionId);
    if (!session) return;
    await minioService.removeTempObject(session.objectKey);
    await prisma.uploadSession.delete({ where: { id: sessionId } });
  }

  public async streamUpload({ objectKey, buffer, size, originalName, mimeType, uploaderName }: {
    objectKey: string;
    buffer: Buffer;
    size: number;
    originalName: string;
    mimeType: string;
    uploaderName?: string;
  }) {
    await minioService.putObject(objectKey, buffer, size, mimeType);
    return this.saveFileRecord({ originalName, objectKey, size, mimeType, uploaderName });
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

    await minioService.appendChunkToTemp(session.objectKey, chunk, rangeStart, Number(session.totalSize));

    const newUploaded = rangeStart + chunk.length;
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { uploadedSize: BigInt(newUploaded) },
    });

    if (newUploaded >= Number(session.totalSize)) {
      return this.finalizeSession(session);
    }

    return { done: false, uploadedSize: newUploaded };
  }

  private async finalizeSession(session: { id: string; objectKey: string; fileName: string; mimeType: string; totalSize: bigint; uploaderName: string | null }) {
    await minioService.finalizeTempObject(session.objectKey, session.mimeType, Number(session.totalSize));

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

  public async getObjectStream(objectKey: string) {
    return minioService.getObjectStream(objectKey);
  }

  public async objectExists(objectKey: string) {
    return minioService.objectExists(objectKey);
  }
}
