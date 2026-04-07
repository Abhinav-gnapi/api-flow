# Microservices Documentation

This document describes the two runtime modes in this repository:

- Core stack (`docker-compose.yml` at repo root)
- Federated stack (`project-flow/docker-compose.yml`)

## 1. Service Catalog

### Core Stack

| Service | Container | Port(s) | Responsibility |
|---|---|---|---|
| `frontend` | `api-flow-frontend` | `8080 -> 80` | Serves React UI, proxies `/api` to backend |
| `backend` | `api-flow-backend` | `${BACKEND_PORT:-5001} -> 5000` | API execution and orchestration service |
| `mongodb` | `api-flow-mongodb` | `27017 -> 27017` | Primary data store |

### Federated Stack (`project-flow`)

| Service | Container | Port(s) | Responsibility |
|---|---|---|---|
| `host` | `project-flow-host` | `3301 -> 80` | React host app (Module Federation consumer) |
| `frontend` | `project-flow-frontend` | `8180 -> 80` | Reused frontend image that serves `remoteEntry.js` |
| `backend` | `project-flow-backend` | `5102 -> 5000` | Same backend API image |
| `mongodb` | `project-flow-mongodb` | `27019 -> 27017` | Data store for project-flow stack |

## 2. Architecture Diagrams

### 2.1 Core Stack Request Flow

```text
Browser
  -> frontend (Nginx + SPA)
      -> /api/* proxied to backend:5000
          -> MongoDB
          -> OpenAI (optional)
          -> GitHub/Jira (optional)
```

### 2.2 Federated Stack Request Flow

```text
Browser (localhost:3301)
  -> host app
      -> loads remoteEntry.js from frontend (localhost:8180)
          -> renders legacyFrontend/LegacyFrontend
              -> /api requests handled by host Nginx proxy
                  -> backend (localhost:5102)
                      -> MongoDB (localhost:27019)
```

## 3. Service Details

### 3.1 Backend

Backend feature modules:

- configs
- payloads
- runner
- reports
- AI
- Swagger/Postman import
- flows
- bug integrations

See detailed API and model docs in `backend/README.md`.

### 3.2 Frontend

- built from `frontend/Dockerfile`
- served via Nginx (`frontend/nginx.conf`)
- exposes `remoteEntry.js` for Module Federation
- supports `/api/` proxying to backend in standalone frontend mode

### 3.3 Host (Federated)

- built from `project-flow/host`
- consumes `legacyFrontend/LegacyFrontend` through Module Federation
- remote entry URL controlled by `VITE_REMOTE_ENTRY_URL`
- proxies `/api/` to `backend:5000`

### 3.4 MongoDB

- standalone Mongo container per stack
- persistent Docker volume mounted at `/data/db`

## 4. Configuration Matrix

### 4.1 Backend Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | DB connection URI | Yes |
| `FRONTEND_URL` / `FRONTEND_URLS` | Allowed CORS origin(s) | No |
| `OPENAI_API_KEY` | AI endpoints | Optional |
| `GITHUB_*` | GitHub issue integration | Optional |
| `JIRA_*` | Jira issue integration | Optional |

### 4.2 Build Args

| Service | Build Arg | Purpose |
|---|---|---|
| core `frontend` | `VITE_API_BASE_URL` | frontend API base path (typically `/api`) |
| `project-flow/host` | `VITE_REMOTE_ENTRY_URL` | remote module URL |

## 5. Deployment Modes

### 5.1 Core Stack

```bash
docker compose up --build
```

Use when you want a direct frontend + backend runtime.

### 5.2 Federated Stack

```bash
cd project-flow
docker compose up --build
```

Use when validating Module Federation with direct frontend remote loading (`host -> frontend`).

## 6. CI/CD and Image Publishing

Workflow file: `.github/workflows/docker-publish.yml`

What it does:

- computes semantic version tag
- builds and pushes images to GHCR:
  - `api-flow-backend`
  - `api-flow-frontend`
- tags repository commit with generated semantic version

## 7. Operational Runbook

### 7.1 Health Checks

- backend: `GET /health`
- verify frontend availability by opening service URL

### 7.2 Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

For project-flow stack:

```bash
cd project-flow
docker compose logs -f host frontend backend mongodb
```

### 7.3 Common Failures

1. `CORS blocked`:
- `FRONTEND_URL`/`FRONTEND_URLS` does not include the active browser origin.

2. `API 502/404 via frontend`:
- Nginx `/api` proxy target mismatch or backend not healthy.

3. `Module Federation remote load failure`:
- `VITE_REMOTE_ENTRY_URL` invalid or frontend container unavailable.

4. `Mongo connection failure`:
- `MONGODB_URI` wrong host/port for current stack.

5. `AI endpoints failing`:
- missing or invalid `OPENAI_API_KEY`.

## 8. Security and Hardening Notes

- Never commit `.env` with real secrets.
- Restrict `FRONTEND_URL`/`FRONTEND_URLS` to trusted origins.
- Use HTTPS + reverse proxy in production.
- Consider auth/rate limiting for backend APIs before public exposure.
