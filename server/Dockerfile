# ---------- builder ----------
FROM node:22.17.0-alpine AS builder
WORKDIR /app

# Copy only package manifests first for better layer caching
COPY server/package*.json server/
COPY client/package*.json client/

# Install deps (server needs dev deps to compile TS; client needs deps to build)
RUN npm ci --prefix server --include=dev
RUN npm ci --prefix client

# Copy sources
COPY server server
COPY client client

# Build client → writes to /app/server/dist/public (per your vite outDir)
RUN npm run build --prefix client

# Build server (tsc) → writes to /app/server/dist/server
RUN npm run build --prefix server


# ---------- runner ----------
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps for the server in the final image
COPY server/package*.json server/
RUN npm ci --omit=dev --prefix server

# Copy built artifacts from builder
COPY --from=builder /app/server/dist/server server/dist/server
COPY --from=builder /app/server/dist/public server/dist/public

# If you serve static files in Express with:
# app.use(express.static(path.resolve(__dirname, "../public")));
# this layout is correct: /app/server/dist/server (code) and ../public (static)

EXPOSE 3000
WORKDIR /app/server
CMD ["node", "dist/server/bin/www.js"]
