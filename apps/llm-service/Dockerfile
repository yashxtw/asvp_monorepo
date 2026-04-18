FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter asvp-llm-service build

WORKDIR /app/apps/llm-service

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["node", "dist/index.js"]
