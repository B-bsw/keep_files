import * as Minio from "minio";
import { config } from "../config";

class MinioService {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.client = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    this.bucket = config.minio.bucket;
  }

  async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async putObject(objectKey: string, data: Buffer | string, size: number, contentType: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.client.putObject as any)(this.bucket, objectKey, data, size, { "Content-Type": contentType });
  }

  async getObjectStream(objectKey: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucket, objectKey);
  }

  async removeObject(objectKey: string) {
    await this.client.removeObject(this.bucket, objectKey);
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async appendChunkToTemp(objectKey: string, chunk: Uint8Array, rangeStart: number, totalSize: number): Promise<void> {
    const tempKey = `tmp_${objectKey}`;

    // Download existing temp data if any, then splice this chunk in
    let existingBuffer = Buffer.alloc(0);
    try {
      const stream = await this.client.getObject(this.bucket, tempKey);
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (d: Buffer) => chunks.push(d));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
      existingBuffer = Buffer.concat(chunks);
    } catch {
      // Temp object doesn't exist yet
    }

    const targetSize = Math.max(existingBuffer.length, rangeStart + chunk.length);
    const newBuffer = Buffer.alloc(targetSize);
    existingBuffer.copy(newBuffer);
    Buffer.from(chunk).copy(newBuffer, rangeStart);

    await this.client.putObject(this.bucket, tempKey, newBuffer, newBuffer.length, {
      "Content-Type": "application/octet-stream",
    });
  }

  async finalizeTempObject(objectKey: string, contentType: string, totalSize: number): Promise<void> {
    const tempKey = `tmp_${objectKey}`;
    const stream = await this.client.getObject(this.bucket, tempKey);
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (d: Buffer) => chunks.push(d));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    const finalBuffer = Buffer.concat(chunks);
    await this.client.putObject(this.bucket, objectKey, finalBuffer, finalBuffer.length, {
      "Content-Type": contentType,
    });
    await this.client.removeObject(this.bucket, tempKey);
  }

  async removeTempObject(objectKey: string) {
    try {
      await this.client.removeObject(this.bucket, `tmp_${objectKey}`);
    } catch {}
  }
}

export const minioService = new MinioService();
