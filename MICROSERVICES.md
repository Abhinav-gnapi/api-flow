# Microservices Documentation

This document describes the microservices architecture across both runtime modes in this repository:

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
| `host` | `project-flow-host` | `3300 -> 80` | React host app (Module Federation consumer) |
| `frontend-bridge` | `project-flow-frontend-bridge` | `4273 -> 80` | Exposes remote module (`remoteEntry.js`) |
| `legacy-frontend` | `project-flow-legacy-frontend` | `8180 -> 80` | Existing frontend image rendered in iframe |
| `backend` | `project-flow-backend` | `5101 -> 5000` | Same backend API image |
| `mongodb` | `project-flow-mongodb` | `27018 -> 27017` | Data store for project-flow stack |

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
Browser (localhost:3300)
  -> host app
      -> loads remoteEntry.js from frontend-bridge (localhost:4273)
          -> renders legacy-frontend iframe (localhost:8180)
              -> legacy frontend calls /api via its own config
                  -> backend (localhost:5101)
                      -> MongoDB (localhost:27018)
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

### 3.2 Frontend (Core Stack)

- built from `frontend/Dockerfile`
- served via Nginx (`frontend/nginx.conf`)
- Nginx proxies `/api/` to `http://backend:5000/api/`
- default runtime URL: `http://localhost:8080`

### 3.3 Host (Federated)

- built from `project-flow/host`
- consumes `frontendBridge/LegacyFrontend` through Module Federation
- remote entry URL controlled by `VITE_REMOTE_ENTRY_URL`

### 3.4 Frontend Bridge

- built from `project-flow/frontend-bridge`
- exposes `./LegacyFrontend` through `remoteEntry.js`
- applies CORS headers for `remoteEntry.js` and `/assets/*`
- bridge renders legacy frontend via iframe

### 3.5 Legacy Frontend

- Docker image reuse of existing frontend
- injected public URL in bridge using `VITE_LEGACY_FRONTEND_PUBLIC_URL`

### 3.6 MongoDB

- standalone Mongo container per stack
- persistent Docker volume mounted at `/data/db`

## 4. Configuration Matrix

### 4.1 Backend Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | DB connection URI | Yes |
| `FRONTEND_URL` | CORS origin | No |
| `OPENAI_API_KEY` | AI endpoints | Optional |
| `GITHUB_*` | GitHub issue integration | Optional |
| `JIRA_*` | Jira issue integration | Optional |

### 4.2 Build Args

| Service | Build Arg | Purpose |
|---|---|---|
| core `frontend` | `VITE_API_BASE_URL` | frontend API base path (typically `/api`) |
| `project-flow/host` | `VITE_REMOTE_ENTRY_URL` | remote module URL |
| `project-flow/frontend-bridge` | `VITE_LEGACY_FRONTEND_PUBLIC_URL` | iframe target for legacy frontend |

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

Use when validating Module Federation layering (`host -> bridge -> legacy frontend`).

## 6. CI/CD and Image Publishing

Workflow file: `.github/workflows/docker-publish.yml`

What it does:

- computes semantic version tag
- builds and pushes images to GHCR:
  - `project-flow-host`
  - `project-flow-backend`
  - `project-flow-legacy-frontend`
  - `project-flow-frontend-bridge`
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
docker compose logs -f host frontend-bridge legacy-frontend backend mongodb
```

### 7.3 Common Failures

1. `CORS blocked`:
- `FRONTEND_URL` does not match the actual browser origin.

2. `API 502/404 via frontend`:
- Nginx `/api` proxy target mismatch or backend not healthy.

3. `Module Federation remote load failure`:
- `VITE_REMOTE_ENTRY_URL` invalid or bridge container unavailable.

4. `Mongo connection failure`:
- `MONGODB_URI` wrong host/port for current stack.

5. `AI endpoints failing`:
- missing or invalid `OPENAI_API_KEY`.

## 8. Security and Hardening Notes

- Never commit `.env` with real secrets.
- Restrict `FRONTEND_URL` to trusted origins.
- Use HTTPS + reverse proxy in production.
- Consider auth/rate limiting for backend APIs before public exposure.

