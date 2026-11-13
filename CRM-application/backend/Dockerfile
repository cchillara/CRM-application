FROM node:22-bookworm-slim

WORKDIR /app

# Prisma's schema uses PostgreSQL; OpenSSL is needed by Prisma's engine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate \
    && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
