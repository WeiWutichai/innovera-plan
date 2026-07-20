# INNOVERA PLAN — production image.
# Multi-stage build → Next.js standalone server + Prisma, with a seeded SQLite
# database baked in as a template. On first start the entrypoint copies the
# template into the data volume, so the container is runnable with zero setup:
#   docker build -t innovera-plan .
#   docker run -p 3000:3000 innovera-plan
# For Postgres in production see docker-compose.yml / README.

# ── deps: install everything (incl. dev) for the build ───────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── builder: generate client, build, and bake a seeded SQLite template ───────
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# create the seed template DB (prisma/seed.db)
RUN DATABASE_URL="file:/app/prisma/seed.db" npx prisma db push --skip-generate \
 && DATABASE_URL="file:/app/prisma/seed.db" npx tsx prisma/seed.ts

# ── runner: minimal standalone server ────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/data/dev.db"
# AUTH_SECRET is intentionally NOT baked in — it must be supplied at runtime
# (e.g. `docker run -e AUTH_SECRET=$(openssl rand -hex 32) ...`). The app fails
# closed (throws) if it is missing or a known placeholder, so tokens can never
# be signed with a public key.

# Next standalone server (includes a traced node_modules)
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Prisma generated client + query engine (ensure present at runtime)
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
# seed template + schema
COPY --from=builder --chown=node:node /app/prisma/seed.db ./prisma/seed.db
COPY --from=builder --chown=node:node /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data && chown -R node:node /app/data /app/prisma

USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
