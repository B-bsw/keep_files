import path from "path";

export const config = {
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
  accessKey: (process.env.ACCESS_KEY || "default-key").trim(),
  jwtSecret: process.env.JWT_SECRET || "super-secret",
  publicApiUrl: process.env.PUBLIC_API_URL || "http://localhost:3001",
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
};
