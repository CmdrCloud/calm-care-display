# Dockerfile for Backend (Fastify + Drizzle)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy backend files
COPY . .

# Build TypeScript
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built app and config
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/infrastructure/migrations ./src/infrastructure/migrations

# Fastify runs on port 3001 by default
EXPOSE 3001

CMD ["node", "dist/server.js"]
