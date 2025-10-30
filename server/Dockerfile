# ---------- builder ----------
FROM node:22.17.0-alpine AS builder
WORKDIR /app

ARG GENERATE_MIGRATIONS=true
ENV GENERATE_MIGRATIONS=${GENERATE_MIGRATIONS}

# Copy only package manifests first for better layer caching
COPY server/package*.json server/
COPY client/package*.json client/

# Install deps (server needs dev deps to compile TS; client needs deps to build)
RUN npm ci --prefix server --include=dev
RUN npm ci --prefix client

# Copy sources
COPY server server
COPY client client

# Generate SQL migrations during build
RUN if [ "$GENERATE_MIGRATIONS" = "true" ]; then \
      echo "Running drizzle-kit generate..."; \
      cd server; \
      npx drizzle-kit generate --name=init --config=drizzle.sys.config.ts; \
      npx drizzle-kit generate --name=init --config drizzle.org.config.ts; \
    else \
      echo "Skipping drizzle-kit generate"; \
    fi

# Build client → writes to /app/server/dist/public (per your vite outDir)
RUN npm run build --prefix client

# Build server (tsc) → writes to /app/server/dist/server
RUN npm run build --prefix server


# ---------- runner ----------
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV MIGRATE_ON_START=true

# Install only production deps for the server in the final image
COPY server/package*.json server/
RUN npm ci --omit=dev --prefix server

# Copy built artifacts from builder
COPY --from=builder /app/server/dist/server server/dist/server
COPY --from=builder /app/server/dist/public server/dist/public

# Copy migrations generated at build time
COPY --from=builder /app/server/drizzle server/drizzle

EXPOSE 3000
WORKDIR /app/server
# Self-migrate, then start
CMD ["sh", "-c", "if [ \"$MIGRATE_ON_START\" = \"true\" ]; then node dist/server/drizzle/migrate.js; else echo 'Skipping DB migrations'; fi; node dist/server/bin/www.js"]
# CMD ["node", "dist/server/bin/www.js"]
