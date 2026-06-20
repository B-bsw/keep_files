import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { appendFile } from "fs/promises";
import path from "path";

import { config } from "./src/config";
import { AuthService } from "./src/services/AuthService";
import { FileService } from "./src/services/FileService";
import { TokenService } from "./src/services/TokenService";
import { authController } from "./src/controllers/AuthController";
import { fileController } from "./src/controllers/FileController";

const authService = new AuthService();
const fileService = new FileService();
const tokenService = new TokenService();

const app = new Elysia({ serve: { maxRequestBodySize: 10 * 1024 * 1024 * 1024 } })
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-access-key"],
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
  .onBeforeHandle(({ isAuthenticated, set, path }) => {
    if (
      path === "/" ||
      path === "/health" ||
      path.endsWith("/content") ||
      path === "/auth/login"
    )
      return;

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

    set.status = 500;
    return {
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred",
    };
  });

// Mount controllers
app.use(authController(authService));
app.use(
  fileController(fileService, tokenService, (topic, data) => {
    app.server?.publish(topic, data);
  })
);

app.listen({ port: config.port, hostname: "0.0.0.0" });

console.log(
  `🦊 Backend is running at ${app.server?.hostname}:${app.server?.port}`,
);
