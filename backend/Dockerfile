# ==========================================
# Multi-stage Dockerfile untuk ArahIn Backend
# ==========================================

# Stage 1: Build TypeScript
FROM node:22-alpine AS builder
WORKDIR /app

# Salin package files dan konfigurasi TypeScript
COPY package*.json tsconfig.json ./
RUN npm ci

# Salin source code dan pendukung
COPY src ./src
COPY types ./types
COPY scripts ./scripts

# Build TypeScript ke folder dist/
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install dependencies produksi saja (tanpa devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Ambil hasil kompilasi dari stage builder
COPY --from=builder /app/dist ./dist

# Salin OpenAPI specification untuk endpoint /api/v1/openapi.yaml
COPY openapi.yaml ./

# Keamanan: jalankan sebagai user non-root 'node'
USER node

EXPOSE 4000

# Healthcheck otomatis setiap 15 detik
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "dist/src/server.js"]
