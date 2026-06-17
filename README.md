# File Storages (Keep Files)

A full-stack file storage application consisting of a Next.js frontend and an ElysiaJS backend API.

## 🚀 Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [HeroUI](https://heroui.com/)
- **Package Manager & Runtime:** [Bun](https://bun.sh/)

### Backend
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Package Manager & Runtime:** [Bun](https://bun.sh/)

## 🛠 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Docker](https://www.docker.com/) and Docker Compose (for running via containers)
- [Bun](https://bun.sh/) (if you plan to run or develop locally without Docker)

## ⚙️ Environment Variables

Before running the project, you need to set up the environment variables.

1. **Root Directory (Docker Compose)**
   Copy the example file and update the values:
   ```bash
   cp .env.example .env
   ```

2. **Frontend**
   Copy the example file in the `frontend` directory:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   *(Update `NEXT_PUBLIC_API_URL` if you change the API port)*

3. **Backend**
   The backend environment variables are typically provided by the root `.env` when running via Docker. If running locally, ensure the `.env` in the root is properly configured for the database URL and API keys.

## 🐳 Running with Docker (Recommended)

You can run the entire stack (Frontend, Backend, and Database if configured) using Docker Compose.

1. Build and start the containers in the background:
   ```bash
   docker compose up -d --build
   ```

2. Access the applications:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

3. To stop the containers:
   ```bash
   docker compose down
   ```

## 💻 Running Locally (Development Mode)

If you prefer to run the applications directly on your machine without Docker:

### 1. Backend API
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
bun install

# Apply database migrations (if required by Prisma)
bunx prisma db push

# Start the API
bun run index.ts
```

### 2. Frontend
Open another terminal and navigate to the `frontend` folder:
```bash
cd frontend
bun install

# Start the Next.js development server
bun run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

```
.
├── backend/            # ElysiaJS API
├── frontend/           # Next.js web application
├── uploads/            # Directory for stored files (mapped as a Docker volume)
├── docker-compose.yml  # Docker compose configuration
└── README.md
```
