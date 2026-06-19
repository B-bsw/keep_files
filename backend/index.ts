import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
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

const app = new Elysia()
  .use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-key']
  }))
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'super-secret',
      exp: '30d'
    })
  )
  .ws('/ws', {
    open(ws) {
      ws.subscribe('files');
    }
  })
  .derive(async ({ request, cookie: { auth }, jwt }) => {
    const authHeader = request.headers.get("x-access-key") || request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get("key") || undefined;
    }

    let isAuthenticated = false;

    if (token === ACCESS_KEY) {
      isAuthenticated = true;
    } else if (auth?.value) {
      const profile = await jwt.verify(auth.value as string);
      if (profile) {
        isAuthenticated = true;
      }
    }

    return { isAuthenticated };
  })
  .onBeforeHandle(({ isAuthenticated, set, path }) => {
    if (path === "/" || path === "/health" || path.endsWith("/content") || path === "/auth/login") return;

    if (!isAuthenticated) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", () => "Keep Files API")
  .get("/health", () => ({ status: "ok" }))
  .onError(({ code, error, set, request }) => {
    const err = error as Error;
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [API Error - ${code}] ${request.method} ${request.url}\n${err.message}\n${err.stack || ''}\n----------------------------------------\n`;

    console.error(logMsg);
    // Write to error.log
    appendFile(path.join(process.cwd(), "error.log"), logMsg).catch(e => console.error("Failed to write to error.log", e));

    if (err.message?.includes("Can't reach database") || err.message?.includes("Invalid `prisma.") || err.name === "PrismaClientInitializationError") {
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
      message: err.message || "An unexpected error occurred"
    };
  })
  .post("/auth/verify", ({ isAuthenticated }) => ({ valid: isAuthenticated }))
  .post("/auth/login", async ({ body, jwt, cookie, set }) => {
    if (body.keyword === ACCESS_KEY) {
      const token = await jwt.sign({
        authorized: true,
        role: "admin"
      });
      if (!cookie.auth) cookie.auth = {} as any;
      cookie.auth!.set({
        value: token,
        httpOnly: true,
        maxAge: 3 * 86400,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return { success: true };
    }
    set.status = 401;
    return { error: "Invalid keyword" };
  }, {
    body: t.Object({
      keyword: t.String()
    })
  })
  .post("/auth/logout", ({ cookie }) => {
    if (cookie.auth) cookie.auth.remove();
    return { success: true };
  })
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

    app.server?.publish('files', JSON.stringify({ type: 'FILE_ADDED', data: newFile }));

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

    app.server?.publish('files', JSON.stringify({ type: 'FILE_DELETED', data: { id: fileId } }));

    return { success: true, message: "File deleted successfully" };
  })
  .patch("/files/:id", async ({ params, body }) => {
    const fileId = params.id;
    const { originalName, uploaderName } = body as { originalName?: string, uploaderName?: string };

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error("File not found");
    }

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

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        ...(originalName && { originalName: finalOriginalName }),
        ...(uploaderName !== undefined && { uploaderName }),
      },
    });

    app.server?.publish('files', JSON.stringify({ type: 'FILE_UPDATED', data: updatedFile }));

    return updatedFile;
  }, {
    body: t.Object({
      originalName: t.Optional(t.String()),
      uploaderName: t.Optional(t.String()),
    })
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
