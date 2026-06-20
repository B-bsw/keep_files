# keep_files_api

ElysiaJS backend API for Keep Files — handles file uploads, resumable sessions, and authentication.

## Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **ORM:** [Prisma](https://www.prisma.io/) (MySQL)
- **Object Storage:** [MinIO](https://min.io/) via `minio` SDK

## Setup

```bash
bun install
cp .env.example .env   # then fill in values
bunx prisma db push
bun run index.ts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | — |
| `PUBLIC_API_URL` | Public URL for download link generation | `http://localhost:3001` |
| `ACCESS_KEY` | Static API access key | — |
| `MINIO_ENDPOINT` | MinIO host | `localhost` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_USE_SSL` | Use HTTPS for MinIO | `false` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET` | Bucket name | `keep-files` |

## API Endpoints

### Files
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/files` | List all files |
| `POST` | `/files/upload` | Upload a file (multipart) |
| `POST` | `/files/upload/stream` | Upload a file (raw stream) |
| `DELETE` | `/files/:id` | Delete a file |
| `PATCH` | `/files/:id` | Rename a file |
| `POST` | `/files/:id/request-access` | Get a time-limited download token |
| `GET` | `/files/:id/content?token=` | Download a file |

### Resumable Upload Sessions
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/files/upload/session` | Create a new upload session |
| `GET` | `/files/upload/session/:sessionId` | Get session progress |
| `PUT` | `/files/upload/session/:sessionId` | Upload a chunk (`Content-Range` header required) |
| `DELETE` | `/files/upload/session/:sessionId` | Cancel and clean up session |

## File Storage

Files are stored as objects in MinIO. Incomplete resumable uploads are stored temporarily with a `tmp_` prefix and are cleaned up automatically on startup and every hour.
