# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – deps
#   Install ALL workspace dependencies (including dev) so we can build.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy manifests first for better layer caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY packages/shared/package.json              ./packages/shared/package.json
COPY apps/api/package.json                     ./apps/api/package.json
COPY apps/admin/package.json                   ./apps/admin/package.json
COPY apps/storefront/package.json              ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – build
#   Compile @shimeka/shared, generate Prisma, build all three apps.
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/shared    ./packages/shared
COPY apps/api           ./apps/api
COPY apps/admin         ./apps/admin
COPY apps/storefront    ./apps/storefront

# 1. Build the shared package first (all apps depend on it).
RUN pnpm --filter @shimeka/shared build

# 2. Generate Prisma client.
RUN pnpm --filter @shimeka/api prisma:generate

# 3. Build all three apps in parallel via turbo.
RUN pnpm --filter @shimeka/api build \
 && pnpm --filter @shimeka/admin build \
 && pnpm --filter @shimeka/storefront build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 – production image
#   Lean runtime: API (NestJS) + admin (Next.js standalone) +
#   storefront (Next.js standalone) managed by supervisord.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# supervisord to manage three processes in one container.
RUN apk add --no-cache supervisor

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ── API: prod deps + compiled output ─────────────────────────────────────────
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY packages/shared/package.json   ./packages/shared/package.json
COPY apps/api/package.json          ./apps/api/package.json
COPY apps/admin/package.json        ./apps/admin/package.json
COPY apps/storefront/package.json   ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist          ./packages/shared/dist

# API
COPY --from=builder /app/apps/api/dist                 ./apps/api/dist
COPY --from=builder /app/apps/api/prisma               ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma

# Admin (Next.js standalone — self-contained server.js + static assets)
COPY --from=builder /app/apps/admin/.next/standalone   ./apps/admin/.next/standalone
COPY --from=builder /app/apps/admin/.next/static       ./apps/admin/.next/standalone/apps/admin/.next/static
COPY --from=builder /app/apps/admin/public             ./apps/admin/.next/standalone/apps/admin/public

# Storefront (Next.js standalone)
COPY --from=builder /app/apps/storefront/.next/standalone  ./apps/storefront/.next/standalone
COPY --from=builder /app/apps/storefront/.next/static      ./apps/storefront/.next/standalone/apps/storefront/.next/static
COPY --from=builder /app/apps/storefront/public            ./apps/storefront/.next/standalone/apps/storefront/public

# ── Uploads directory ────────────────────────────────────────────────────────
# UPLOAD_LOCAL_DIR defaults to "uploads" (resolved relative to cwd = /app/apps/api).
RUN mkdir -p /app/apps/api/uploads \
    && chown -R node:node /app/apps/api/uploads \
    && chmod 755 /app/apps/api/uploads

# ── supervisord config ────────────────────────────────────────────────────────
COPY <<'EOF' /etc/supervisor/conf.d/shimeka.conf
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0

[program:api]
command=sh -c "node node_modules/.bin/prisma migrate deploy && node dist/main.js"
directory=/app/apps/api
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production"

[program:admin]
command=node server.js
directory=/app/apps/admin/.next/standalone/apps/admin
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production",PORT="3001",HOSTNAME="0.0.0.0"

[program:storefront]
command=node server.js
directory=/app/apps/storefront/.next/standalone/apps/storefront
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production",PORT="3000",HOSTNAME="0.0.0.0"
EOF

EXPOSE 4000 3000 3001

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/shimeka.conf"]
