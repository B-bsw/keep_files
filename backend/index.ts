import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const ACCESS_KEY = process.env.ACCESS_KEY || "default-key";

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const authMiddleware = (app: Elysia) =>
  app.derive(({ request }) => {
    const authHeader = request.headers.get("x-access-key") || request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    return {
      isAuthenticated: token === ACCESS_KEY,
    };
  });

const app = new Elysia()
  .use(cors())
  .use(authMiddleware)
  .onBeforeHandle(({ isAuthenticated, set, path }) => {
    if (path === "/" || path === "/health") return;
    
    if (!isAuthenticated) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", () => "Keep Files API")
  .get("/health", () => ({ status: "ok" }))
  .onError(({ code, error, set }) => {
    console.error(`[API Error - ${code}]:`, error);
    
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
  .get("/files/:id/download", async ({ params, set }) => {
    const fileId = params.id;
    
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      set.status = 404;
      return { error: "File not found" };
    }

    const filePath = path.join(UPLOAD_DIR, file.objectKey);
    if (!existsSync(filePath)) {
      set.status = 404;
      return { error: "File physical content not found on server" };
    }

    // In local mode, since we don't have presigned URLs, 
    // we could directly stream the file to the client through the API route.
    // However, the proxy setup in frontend (`/api/files/[id]/download`) expects a `{ url: "..." }` response,
    // so let's provide a local API url that bypasses some auth, OR better:
    // Update the backend to just stream the file content, and we'll change the frontend download logic to fetch a Blob.
    
    // Actually, to make it simple without changing frontend much, we can provide a URL 
    // that points to a new endpoint `/files/:id/content` with a temporary token, 
    // or we just rely on passing the Access Key.
    // Let's create an endpoint `/files/:id/content` that streams the file and we return that URL here.
    
    const downloadUrl = `${process.env.PUBLIC_API_URL || "http://localhost:3001"}/files/${file.id}/content?key=${process.env.ACCESS_KEY}`;
    return { url: downloadUrl };
  })
  .get("/files/:id/content", async ({ params, query, set }) => {
    // This endpoint allows downloading the actual file content 
    // using a query parameter key for simple link sharing/downloading.
    if (query.key !== ACCESS_KEY) {
      set.status = 401;
      return { error: "Unauthorized" };
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