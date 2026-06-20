# File Storages (Keep Files)

A full-stack file storage application consisting of a Next.js frontend and an ElysiaJS backend API.

## Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [HeroUI](https://heroui.com/)
- **Package Manager & Runtime:** [Bun](https://bun.sh/)

### Backend
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Object Storage:** [MinIO](https://min.io/)
- **Package Manager & Runtime:** [Bun](https://bun.sh/)

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (for running via containers)
- [Bun](https://bun.sh/) (if running locally without Docker)

## Environment Variables

### Root Directory (Docker Compose)
```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | — |
| `PUBLIC_API_URL` | Backend public URL | `http://localhost:3001` |
| `ACCESS_KEY` | App secret key | — |
| `NEXT_PUBLIC_API_URL` | Frontend → API URL | `http://localhost:3001` |
| `MINIO_ACCESS_KEY` | MinIO root user | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO root password | `minioadmin` |
| `MINIO_BUCKET` | Bucket name | `keep-files` |

### Backend (local dev only)
```bash
cp backend/.env.example backend/.env
```

Additional vars needed when running the backend outside Docker:

| Variable | Description | Default |
|----------|-------------|---------|
| `MINIO_ENDPOINT` | MinIO host | `localhost` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_USE_SSL` | Use HTTPS | `false` |

## Running with Docker (Recommended)

```bash
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| MinIO Console | http://localhost:9001 |

```bash
docker compose down
```

## Running Locally (Development)

### 1. Start MinIO
```bash
docker compose up minio -d
```

### 2. Backend
```bash
cd backend
bun install
bunx prisma db push
bun run index.ts
```

### 3. Frontend
```bash
cd frontend
bun install
bun run dev
```

## Project Structure

```
.
├── backend/            # ElysiaJS API
├── frontend/           # Next.js web application
├── docker-compose.yml  # Docker Compose configuration
└── .env.example        # Root environment variable template
```

## File Storage

Files are stored in MinIO object storage. When running via Docker Compose, data is persisted in a named volume (`minio_data`). Incomplete (resumable) uploads are stored as temporary objects prefixed with `tmp_` and are automatically cleaned up on server startup and every hour thereafter.
