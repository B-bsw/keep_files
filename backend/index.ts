import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync } from "fs";
import { unlink, appendFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const ACCESS_KEY = process.env.ACCESS_KEY || "default-key";

// Store temporary short-lived tokens for file access
const tempTokens = new Map<string, { fileId: string, expiresAt: number }>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tempTokens.entries()) {
    if (now > data.expiresAt) {
      tempTokens.delete(token);
    }
  }
}, 60 * 1000);

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const authMiddleware = (app: Elysia) =>
  app.derive(({ request }) => {
    const authHeader = request.headers.get("x-access-key") || request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get("key") || undefined;
    }
    
    return {
      isAuthenticated: token === ACCESS_KEY,
    };
  });

const app = new Elysia()
  .use(cors())
  .use(authMiddleware)
  .onBeforeHandle(({ isAuthenticated, set, path }) => {
    if (path === "/" || path === "/health" || path.endsWith("/content")) return;
    
    if (!isAuthenticated) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", () => "Keep Files API")
  .get("/health", () => ({ status: "ok" }))
  .onError(({ code, error, set, request }) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [API Error - ${code}] ${request.method} ${request.url}\n${error.message}\n${error.stack || ''}\n----------------------------------------\n`;
    
    console.error(logMsg);
    // Write to error.log
    appendFile(path.join(process.cwd(), "error.log"), logMsg).catch(err => console.error("Failed to write to error.log", err));
    
    if (error.message?.includes("Can't reach database") || error.message?.includes("Invalid `prisma.") || error.name === "PrismaClientInitializationError") {
      set.status = 503;
      return { 
        error: "Database Connection Error", 
        message: "Unable to connect to the database. Please ensure the database service is running." 
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: "Not Found", message: "The requested resource could not be found." };
    }
    
    set.status = 500;
    return {
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred"
    };
  })
  .post("/auth/verify", ({ isAuthenticated }) => ({ valid: isAuthenticated }))
  .get("/files", async () => {
    const files = await prisma.file.findMany({
      orderBy: { uploadDate: "desc" },
    });
    return files;
  })
  .post("/files/upload", async ({ body }) => {
    const file = body.file as File;
    const uploaderName = body.uploaderName as string | undefined;

    if (!file) {
      throw new Error("No file uploaded");
    }

    const originalName = file.name;
    const mimeType = file.type;
    const size = file.size;
    
    // Generate unique object key
    const ext = originalName.split('.').pop() || '';
    const objectKey = `${crypto.randomUUID()}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, objectKey);

    // Save to local file system
    await Bun.write(filePath, file);

    // Save to Prisma
    const newFile = await prisma.file.create({
      data: {
        originalName,
        objectKey,
        size,
        mimeType,
        uploaderName: uploaderName || null,
      },
    });

    return newFile;
  }, {
    body: t.Object({
      file: t.File(),
      uploaderName: t.Optional(t.String()),
    })
  })
  .delete("/files/:id", async ({ params }) => {
    const fileId = params.id;
    
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Delete from local file system
    const filePath = path.join(UPLOAD_DIR, file.objectKey);
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error("Error deleting local file:", error);
    }

    // Delete from Prisma
    await prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true, message: "File deleted successfully" };
  })
  .post("/files/:id/request-access", async ({ params, set }) => {
    const fileId = params.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      set.status = 404;
      return { error: "File not found" };
    }

    const token = crypto.randomUUID();
    // Token valid for 5 minutes
    tempTokens.set(token, { fileId, expiresAt: Date.now() + 5 * 60 * 1000 });

    const downloadUrl = `${process.env.PUBLIC_API_URL || "http://localhost:3001"}/files/${file.id}/content?token=${token}`;
    return { token, url: downloadUrl };
  })
  .get("/files/:id/download", async ({ params, set }) => {
    // This endpoint is kept for backwards compatibility but shouldn't be used directly 
    // to bypass the password prompt anymore, unless it relies on standard auth.
    // However, the requirement says we MUST ask for a password to get a token.
    set.status = 403;
    return { error: "Please request access with a password first" };
  })
  .get("/files/:id/content", async ({ params, query, set }) => {
    const { token } = query;
    const tokenData = tempTokens.get(token as string);

    if (!tokenData || tokenData.fileId !== params.id || Date.now() > tokenData.expiresAt) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      set.status = 404;
      return { error: "File not found" };
    }

    const filePath = path.join(UPLOAD_DIR, file.objectKey);
    if (!existsSync(filePath)) {
      set.status = 404;
      return { error: "File physical content not found" };
    }

    set.headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(file.originalName)}"`;
    set.headers["Content-Type"] = file.mimeType;
    
    return Bun.file(filePath);
  });

app.listen(3001);

console.log(`🦊 Backend is running at ${app.server?.hostname}:${app.server?.port}`);