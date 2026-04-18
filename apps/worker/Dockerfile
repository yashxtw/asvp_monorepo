FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter asvp-worker build

WORKDIR /app/apps/worker

ENV NODE_ENV=production

CMD ["node", "dist/apps/worker/src/index.js"]
