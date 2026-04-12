Starting Dev Environment

1. Copy env:
`cp .env.example .env`

2. Choose Temporal mode:
- Primary / recommended: `Temporal Cloud`
- Optional local fallback:
  `docker-compose --profile local-temporal --env-file .env -f docker/docker-compose.yml up -d`

3. Configure Redis Cloud:
- set `REDIS_URL` in `.env`
- use the full Redis Cloud connection string, usually `rediss://...`

4. Start services:
- `pnpm dev --filter asvp-frontend`
- `pnpm dev --filter asvp-backend`
- `pnpm dev --filter asvp-worker`
- `pnpm dev --filter asvp-llm-service`
- `pnpm dev --filter asvp-ner-service`

5. Run migrations if needed:
`pnpm migrate`

Notes
- Backend and worker now read `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY`, and `TEMPORAL_TLS`.
- If you use Temporal Cloud, you do not need local `temporal` or `temporal-web` containers.
- Redis is expected to come from Redis Cloud via `REDIS_URL`.
