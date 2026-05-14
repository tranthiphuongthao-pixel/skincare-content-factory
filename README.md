# Skincare Content Factory

Skincare Content Factory is a full-stack app for creating TikTok skincare content with AI-generated scripts, a product library, and video planning.

## Project structure

- `frontend/` — React + Vite app with Tailwind and Nginx for production
- `backend/` — FastAPI backend with PostgreSQL support
- `docker-compose.yml` — local development stack for frontend, backend, and database
- `schema.sql` — database schema for Postgres
- `DEPLOY.md` — deployment guide for Railway

## Quick Start (local)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Edit both files with real values

docker compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:8000/docs

## Deployment

The recommended deployment path is Railway using the existing `backend/railway.toml` and `frontend/railway.toml` configuration.

See `DEPLOY.md` for step-by-step instructions.

## Notes

- `frontend` calls the backend through `/api`, and `frontend/nginx.conf` proxies `/api/` and `/uploads/` to the backend service.
- In production, do not commit `.env` or `backend/.env`.
- Uploaded product images currently persist only in the runtime container (`backend/uploads/`). For a production-ready app, switch to object storage (S3/R2/Supabase Storage).
