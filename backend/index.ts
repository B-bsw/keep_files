import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { appendFile } from "fs/promises";
import path from "path";

import { config } from "./src/config";
import { AuthService } from "./src/services/AuthService";
import { FileService } from "./src/services/FileService";
import { FolderService } from "./src/services/FolderService";
import { ShareService } from "./src/services/ShareService";
import { TokenService } from "./src/services/TokenService";
import { authController } from "./src/controllers/AuthController";
import { fileController } from "./src/controllers/FileController";
import { folderController } from "./src/controllers/FolderController";
import { shareController } from "./src/controllers/ShareController";

const authService = new AuthService();
const fileService = new FileService();
const folderService = new FolderService();
const shareService = new ShareService();
const tokenService = new TokenService();

const app = new Elysia({ serve: { maxRequestBodySize: 10 * 1024 * 1024 * 1024 } })
  .use(
    cors({
      // Dev: reflect any origin so uploads work from localhost/127.0.0.1/LAN IPs.
      // Production: locked down to the CORS_ORIGIN allowlist.
      origin:
        config.nodeEnv === "production" ? config.corsOrigins : true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-access-key", "x-file-name", "x-uploader-name", "x-folder-id", "Content-Range"],
    }),
  )
  .use(
    jwt({
      name: "jwt",
      secret: config.jwtSecret,
      exp: "30d",
    }),
  )
  .ws("/ws", {
    // Real-time topic requires the same auth as the REST API — otherwise
    // anyone could subscribe and watch file events.
    beforeHandle: async ({ request, cookie: { auth }, jwt }) => {
      const url = new URL(request.url);
      const token =
        request.headers.get("x-access-key") ||
        request.headers.get("authorization")?.replace("Bearer ", "") ||
        url.searchParams.get("key") ||
        undefined;

      let authorized = false;
      if (token === config.accessKey) {
        authorized = true;
      } else {
        const jwtToken = auth?.value || token;
        if (jwtToken && (await jwt.verify(jwtToken as string))) authorized = true;
      }

      if (!authorized) throw new Error("Unauthorized WebSocket");
    },
    open(ws) {
      ws.subscribe("files");
    },
  })
  .derive(async ({ request, cookie: { auth }, jwt }) => {
    const authHeader =
      request.headers.get("x-access-key") ||
      request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get("key") || undefined;
    }

    let isAuthenticated = false;

    if (token === config.accessKey) {
      isAuthenticated = true;
    } else {
      const jwtToken = auth?.value || token;
      if (jwtToken) {
        const profile = await jwt.verify(jwtToken as string);
        if (profile) {
          isAuthenticated = true;
        }
      }
    }

    return { isAuthenticated };
  })
  .onBeforeHandle(({ isAuthenticated, set, path, request }) => {
    if (path === "/" || path === "/health" || path === "/auth/login") return;

    // File content is guarded by short-lived access tokens instead of auth.
    if (path.endsWith("/content")) return;

    // Public share access is exactly:
    //   GET  /share/:token           — link info
    //   POST /share/:token/access    — download URL (DOWNLOAD links only)
    //   GET  /share/:token/preview   — inline image preview
    // Everything else under /share (create/list/delete links) requires auth —
    // a plain startsWith("/share/") check used to leak those routes publicly.
    const shareMatch = path.match(/^\/share\/([^/]+)(\/access|\/preview)?$/);
    if (shareMatch) {
      const method = request.method.toUpperCase();
      const isInfoGet = method === "GET" && !shareMatch[2];
      const isAccessPost = method === "POST" && shareMatch[2] === "/access";
      const isPreviewGet = method === "GET" && shareMatch[2] === "/preview";
      if (isInfoGet || isAccessPost || isPreviewGet) return;
    }

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
    const logMsg = `[${timestamp}] [API Error - ${code}] ${request.method} ${request.url}\n${err.message}\n${err.stack || ""}\n----------------------------------------\n`;

    console.error(logMsg);
    // Write to error.log
    appendFile(path.join(process.cwd(), "error.log"), logMsg).catch((e) =>
      console.error("Failed to write to error.log", e),
    );

    // Rejected WebSocket upgrade
    if (err.message === "Unauthorized WebSocket") {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    if (
      err.message?.includes("Can't reach database") ||
      err.message?.includes("Invalid `prisma.") ||
      err.name === "PrismaClientInitializationError"
    ) {
      set.status = 503;
      return {
        error: "Database Connection Error",
        message:
          "Unable to connect to the database. Please ensure the database service is running.",
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Not Found",
        message: "The requested resource could not be found.",
      };
    }

    // Don't leak internal error details to clients — full detail goes to error.log.
    set.status = 500;
    return {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };
  });

// Mount controllers
app.use(authController(authService));
app.use(
  fileController(fileService, tokenService, (topic, data) => {
    app.server?.publish(topic, data);
  })
);
app.use(folderController(folderService));
app.use(shareController(shareService, fileService, tokenService));

app.listen({ port: config.port, hostname: "0.0.0.0" });

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  JWT_SECRET is not set — falling back to an insecure default. Set it before deploying!",
  );
}
if (!process.env.ACCESS_KEY) {
  console.warn("⚠️  ACCESS_KEY is not set — using the insecure default key.");
}

console.log(
  `🦊 Backend is running at ${app.server?.hostname}:${app.server?.port}`,
);
