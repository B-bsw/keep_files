export const config = {
  accessKey: (process.env.ACCESS_KEY || "default-key").trim(),
  jwtSecret: process.env.JWT_SECRET || "super-secret",
  publicApiUrl: process.env.PUBLIC_API_URL || "http://localhost:3001",
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: Number(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    bucket: process.env.MINIO_BUCKET || "keep-files",
  },
};
