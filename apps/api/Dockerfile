FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm install --frozen-lockfile --filter @pos/api...

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app ./
EXPOSE 3000
CMD ["node", "apps/api/src/server.js"]
