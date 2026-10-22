FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# 1. Install all dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY apps/web/ apps/web/
RUN pnpm install --frozen-lockfile

# 2. Build the frontend SPA
FROM dependencies AS builder
RUN pnpm --filter @pos/shared build && pnpm --filter @pos/web build

# 3. Production runner
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps/api ./apps/api
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 4000
CMD ["node", "apps/api/src/server.js"]
