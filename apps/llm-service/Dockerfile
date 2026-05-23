FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/llm-service/package.json apps/llm-service/package.json

RUN pnpm install --frozen-lockfile

COPY apps/llm-service apps/llm-service

RUN pnpm --filter asvp-llm-service build
RUN pnpm --filter asvp-llm-service deploy --prod --legacy /prod/llm-service

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5050

COPY --from=builder /prod/llm-service ./

USER node

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5050) + '/health').then((res) => { if (!res.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
