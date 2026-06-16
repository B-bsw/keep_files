FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install
RUN bunx prisma generate

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "run", "index.ts"]
