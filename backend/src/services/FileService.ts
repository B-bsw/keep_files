import { prisma } from "../db";
import { minioService } from "./MinioService";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

export class FileService {
  constructor() {
    minioService.ensureBucket().catch(console.error);
    this.cleanupExpiredSessions().catch(console.error);
    setInterval(() => this.cleanupExpiredSessions().catch(console.error), 60 * 60 * 1000).unref();
  }

  private async cleanupExpiredSessions() {
    const expired = await prisma.uploadSession.findMany({
      where: { expiresAt: { lt: new Date() } },
    });
    for (const session of expired) {
      await minioService.removeParts(session.objectKey);
      await prisma.uploadSession.delete({ where: { id: session.id } });
    }
    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired upload session(s)`);
    }
  }

  public async getAllFiles(folderId?: string | null) {
    return prisma.file.findMany({
      where: folderId !== undefined ? { folderId } : {},
      orderBy: { uploadDate: "desc" },
    });
  }

  public async getFileById(id: string) {
    return prisma.file.findUnique({ where: { id } });
  }

  public async saveFile(file: globalThis.File, uploaderName?: string) {
    const originalName = file.name;
    const mimeType = file.type;

    const ext = originalName.split(".").pop() || "";
    const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;

    // Stream the file through to MinIO instead of buffering it in RAM.
    const { Readable } = await import("stream");
    const size = await minioService.putObjectStream(
      objectKey,
      Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]),
      mimeType,
    );

    return prisma.file.create({
      data: {
        originalName,
        objectKey,
        size: BigInt(size),
        mimeType,
        uploaderName: uploaderName || null,
      },
    });
  }

  public async deleteFile(id: string) {
    const file = await this.getFileById(id);
    if (!file) throw new Error("File not found");

    // Delete the DB row first so the UI never references an object we
    // failed to remove; a leftover MinIO object is preferable to a broken record.
    await prisma.file.delete({ where: { id } });

    try {
      await minioService.removeObject(file.objectKey);
    } catch (error) {
      console.error("Error deleting object from MinIO:", error);
    }
    return true;
  }

  public async cancelUploadSession(sessionId: string) {
    const session = await this.getUploadSession(sessionId);
    if (!session) return;
    await minioService.removeParts(session.objectKey);
    await prisma.uploadSession.delete({ where: { id: sessionId } });
  }

  public async streamUpload({ objectKey, source, originalName, mimeType, uploaderName, folderId }: {
    objectKey: string;
    source: NodeJS.ReadableStream;
    originalName: string;
    mimeType: string;
    uploaderName?: string;
    folderId?: string;
  }) {
    // Stream straight to MinIO — memory stays flat regardless of file size.
    const size = await minioService.putObjectStream(objectKey, source, mimeType);

    if (size > MAX_FILE_SIZE) {
      await minioService.removeObject(objectKey);
      throw new Error("File exceeds 5 GB limit");
    }

    return this.saveFileRecord({ originalName, objectKey, size, mimeType, uploaderName, folderId });
  }

  public async saveFileRecord({ originalName, objectKey, size, mimeType, uploaderName, folderId }: {
    originalName: string;
    objectKey: string;
    size: number;
    mimeType: string;
    uploaderName?: string;
    folderId?: string;
  }) {
    return prisma.file.create({
      data: { originalName, objectKey, size: BigInt(size), mimeType, uploaderName: uploaderName || null, folderId: folderId || null },
    });
  }

  public async createUploadSession(
    fileName: string,
    mimeType: string,
    totalSize: number,
    uploaderName?: string,
    folderId?: string,
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
        folderId: folderId || null,
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

    await minioService.putChunkPart(session.objectKey, chunk, rangeStart);

    // max() keeps progress monotonic if chunks race or retry.
    const newUploaded = Math.max(Number(session.uploadedSize), rangeStart + chunk.byteLength);
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { uploadedSize: BigInt(newUploaded) },
    });

    if (newUploaded >= Number(session.totalSize)) {
      return this.finalizeSession(session);
    }

    return { done: false, uploadedSize: newUploaded };
  }

  private async finalizeSession(session: { id: string; objectKey: string; fileName: string; mimeType: string; totalSize: bigint; uploaderName: string | null; folderId?: string | null }) {
    // Server-side compose — no bytes flow through the backend.
    await minioService.composeParts(session.objectKey);

    let newFile: Awaited<ReturnType<FileService["saveFileRecord"]>>;
    try {
      newFile = await this.saveFileRecord({
        originalName: session.fileName,
        objectKey: session.objectKey,
        size: Number(session.totalSize),
        mimeType: session.mimeType,
        uploaderName: session.uploaderName || undefined,
        folderId: session.folderId || undefined,
      });
    } catch (error) {
      // Concurrent finalize for the same objectKey — treat as done.
      const existing = await prisma.file.findUnique({ where: { objectKey: session.objectKey } });
      if (!existing) throw error;
      newFile = existing;
    }

    await prisma.uploadSession.delete({ where: { id: session.id } }).catch(() => {});

    return { done: true, file: newFile };
  }

  public async updateFile(id: string, originalName?: string, uploaderName?: string, folderId?: string | null) {
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
        ...(folderId !== undefined && { folderId }),
      },
    });
  }

  public async getFileInfo(id: string) {
    const file = await this.getFileById(id);
    if (!file) return null;
    const stat = await minioService.statObject(file.objectKey);
    if (!stat) return null;
    return { file, size: stat.size };
  }

  public async getObjectStream(objectKey: string) {
    return minioService.getObjectStream(objectKey);
  }

  public async getObjectRange(objectKey: string, offset: number, length: number) {
    return minioService.getObjectRange(objectKey, offset, length);
  }

  public async objectExists(objectKey: string) {
    return minioService.objectExists(objectKey);
  }
}
