# Dockerfile for Frontend (TanStack Start)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build frontend with node-server preset and production config
ENV NITRO_PRESET=node-server
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy output from builder stage
COPY --from=builder /app/.output ./.output

# TanStack Start / Nitro runs on port 3010 in production (mapped via PORT env)
EXPOSE 3010

CMD ["node", ".output/server/index.mjs"]
