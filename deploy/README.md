# Deployment Notes

This folder contains first-pass deployment scaffolding for GCP.

Recommended target:
- `apps/frontend` -> Cloud Run
- `apps/backend` -> Cloud Run
- `apps/llm-service` -> Cloud Run
- `apps/ner-service` -> Cloud Run
- `apps/worker` -> Compute Engine VM

Managed services already assumed:
- Temporal Cloud
- Redis Cloud

Primary database:
- Cloud SQL for PostgreSQL preferred
- Neon acceptable for phase 1

Images
- Build each service from the repo root as Docker context
- Use the Dockerfile inside each app directory

Examples:
- `docker build -f apps/frontend/Dockerfile -t asvp-frontend .`
- `docker build -f apps/backend/Dockerfile -t asvp-backend .`
- `docker build -f apps/llm-service/Dockerfile -t asvp-llm-service .`
- `docker build -f apps/ner-service/Dockerfile -t asvp-ner-service .`
- `docker build -f apps/worker/Dockerfile -t asvp-worker .`

Environment
- Service-specific env templates live in `deploy/env/`
- Keep secrets in GCP Secret Manager, not in image layers

Important runtime notes
- Backend now respects `PORT` for Cloud Run
- Frontend builds with Next.js standalone output
- Worker connects to Temporal Cloud using:
  - `TEMPORAL_ADDRESS`
  - `TEMPORAL_NAMESPACE`
  - `TEMPORAL_API_KEY`
  - `TEMPORAL_TLS`
- Redis uses `REDIS_URL` only
