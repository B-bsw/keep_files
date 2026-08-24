import * as Minio from "minio";
import { Transform } from "stream";
import { config } from "../config";

class MinioService {
  private client: Minio.Client;
  private bucket: string;

  // Chunk uploads land as per-offset part objects under this prefix and are
  // concatenated server-side on finalize — no bytes flow through the backend.
  private static PARTS_PREFIX = "tmp_parts/";

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

  private partPrefix(objectKey: string) {
    return `${MinioService.PARTS_PREFIX}${objectKey}/`;
  }

  async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  // Store one chunk at its byte offset. Key is zero-padded so lexicographic
  // order equals numeric order when composing later.
  async putChunkPart(objectKey: string, chunk: Uint8Array, rangeStart: number) {
    const partKey = `${this.partPrefix(objectKey)}${String(rangeStart).padStart(16, "0")}`;
    await this.client.putObject(this.bucket, partKey, Buffer.from(chunk), chunk.byteLength, {
      "Content-Type": "application/octet-stream",
    });
  }

  private async listPartKeys(objectKey: string): Promise<string[]> {
    const keys: string[] = [];
    const stream = this.client.listObjects(this.bucket, this.partPrefix(objectKey), true);
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (item) => {
        if (item.name) keys.push(item.name);
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    // Zero-padded offsets sort correctly as strings.
    return keys.sort();
  }

  async removeParts(objectKey: string) {
    try {
      const keys = await this.listPartKeys(objectKey);
      if (keys.length > 0) {
        await this.client.removeObjects(this.bucket, keys);
      }
    } catch {
      // Best-effort cleanup.
    }
  }

  // Concatenate all parts into the final object server-side (composeObject),
  // then remove the parts. Memory stays flat regardless of file size.
  async composeParts(objectKey: string) {
    const partKeys = await this.listPartKeys(objectKey);
    if (partKeys.length === 0) {
      throw new Error("No upload parts found");
    }

    const sources = partKeys.map(
      (key) => new Minio.CopySourceOptions({ Bucket: this.bucket, Object: key }),
    );
    const destination = new Minio.CopyDestinationOptions({
      Bucket: this.bucket,
      Object: objectKey,
    });
    await this.client.composeObject(destination, sources);
    await this.removeParts(objectKey);
  }

  // Stream data straight through to MinIO without buffering it whole.
  // Returns the number of bytes that passed through.
  async putObjectStream(
    objectKey: string,
    source: NodeJS.ReadableStream,
    contentType: string,
  ): Promise<number> {
    let size = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        size += chunk.length;
        cb(null, chunk);
      },
    });
    source.pipe(counter);
    // Omitting size (undefined) = unknown → minio-js switches to multipart
    // upload internally, keeping only one part worth of data in memory.
    // (v8 rejects the legacy -1 sentinel with InvalidArgumentError.)
    await this.client.putObject(this.bucket, objectKey, counter, undefined, {
      "Content-Type": contentType,
    });
    return size;
  }

  async putObject(
    objectKey: string,
    data: Buffer | string,
    size: number,
    contentType: string,
  ) {
    await this.client.putObject(this.bucket, objectKey, data, size, {
      "Content-Type": contentType,
    });
  }

  async getObjectStream(objectKey: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucket, objectKey);
  }

  // Byte range for Range requests (video seek, resumable downloads).
  async getObjectRange(objectKey: string, offset: number, length: number): Promise<NodeJS.ReadableStream> {
    return this.client.getPartialObject(this.bucket, objectKey, offset, length);
  }

  async statObject(objectKey: string): Promise<{ size: number } | null> {
    try {
      const stat = await this.client.statObject(this.bucket, objectKey);
      return { size: Number(stat.size) };
    } catch {
      return null;
    }
  }

  async removeObject(objectKey: string) {
    await this.client.removeObject(this.bucket, objectKey);
  }

  async objectExists(objectKey: string): Promise<boolean> {
    return (await this.statObject(objectKey)) !== null;
  }
}

export const minioService = new MinioService();
