FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
