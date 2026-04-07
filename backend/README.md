# Backend Microservice Documentation

This document explains the backend microservice in detail: architecture, data model, APIs, deployment, and operations.

For cross-service architecture (host, bridge, legacy frontend, backend, MongoDB), see `MICROSERVICES.md` in the repository root.

## 1. Service Overview

The backend is an Express microservice responsible for API-testing workflows.

Core responsibilities:

- API configuration management (`/api/configs`)
- payload management (`/api/payloads`)
- test execution and reporting (`/api/runner`, `/api/reports`)
- AI-assisted payload generation and flow analysis (`/api/ai`)
- Swagger/Postman parsing and import (`/api/swagger`, `/api/postman`)
- multi-step flow execution with variable passing (`/api/flows`)
- issue creation in GitHub and Jira (`/api/bugs`)

Service health endpoint:

- `GET /health`

## 2. Runtime Architecture

### 2.1 Dependencies

- MongoDB for persistence
- Optional OpenAI API for AI endpoints
- Optional GitHub and Jira APIs for bug-ticket creation

### 2.2 Request Path (Docker Compose default stack)

1. Client calls frontend on `http://localhost:8080`
2. Frontend Nginx proxies `/api/*` to backend container (`http://backend:5000/api/*`)
3. Backend executes logic and reads/writes MongoDB
4. Backend returns normalized JSON response

### 2.3 CORS and Network

- CORS origin is controlled by `FRONTEND_URLS` (or `FRONTEND_URL`)
- JSON payload limit is `10mb`
- Backend internal port is `5000`
- In root compose, host maps `${BACKEND_PORT:-5001} -> container:5000`

## 3. Code Layout

```text
backend/
  src/
    controllers/
      ai.controller.js
      apiConfig.controller.js
      bug.controller.js
      flow.controller.js
      payload.controller.js
      postman.controller.js
      report.controller.js
      runner.controller.js
      swagger.controller.js
    models/
      ApiConfig.model.js
      Flow.model.js
      Payload.model.js
      Report.model.js
    routes/
      *.routes.js
    index.js
  Dockerfile
  package.json
  .env.example
```

## 4. Configuration

Create `backend/.env` from `.env.example`.

| Variable | Required | Used By | Description |
|---|---|---|---|
| `PORT` | No | `index.js` | HTTP listen port (default: `5000`) |
| `MONGODB_URI` | Yes | `index.js` | MongoDB connection URI |
| `FRONTEND_URLS` | No | `cors` middleware | Comma-separated allowed browser origins for CORS |
| `FRONTEND_URL` | No | `cors` middleware | Single allowed browser origin for CORS (backward compatible) |
| `OPENAI_API_KEY` | Optional | `ai.controller.js` | Enables AI endpoints |
| `GITHUB_TOKEN` | Optional | `bug.controller.js` | GitHub issue creation auth |
| `GITHUB_OWNER` | Optional | `bug.controller.js` | GitHub org/user |
| `GITHUB_REPO` | Optional | `bug.controller.js` | GitHub repository |
| `JIRA_HOST` | Optional | `bug.controller.js` | Jira cloud host |
| `JIRA_EMAIL` | Optional | `bug.controller.js` | Jira user email |
| `JIRA_API_TOKEN` | Optional | `bug.controller.js` | Jira API token |
| `JIRA_PROJECT_KEY` | Optional | `bug.controller.js` | Jira project key |

## 5. Data Model

### 5.1 ApiConfig

Main API test target definition.

- `name` (required)
- `method` (enum: `GET|POST|PUT|PATCH|DELETE`)
- `url` (required)
- `headers` (object)
- `queryParams` (object)
- `lastRun` (date)
- timestamps

### 5.2 Payload

Test input attached to a config.

- `configId` (required, ref `ApiConfig`)
- `name` (required)
- `body` (object)
- `isAiGenerated` (bool)
- `edgeCaseType` (normalized enum)
- `lastResult`:
  - `statusCode`
  - `latencyMs`
  - `passed`
  - `response`
  - `error`
  - `runAt`
- timestamps

### 5.3 Report

Persisted output of `run-all`.

- `configId`, `configName`, `method`, `url`
- `totalPayloads`, `executed`, `passed`, `failed`
- `results[]` (per payload execution result)
- `runAt`
- timestamps

### 5.4 Flow

Multi-step API flow.

- `name` (required), `description`
- `globalInjectVariables` (e.g. shared auth header template)
- `steps[]`
  - `method`, `url`, `headers`, `body`
  - `extractVariables` (e.g. `{ "token": "$.data.token" }`)
  - `injectVariables` (templated values with `{{token}}`)
- `aiSuggestions`
- `lastRunResult`
- timestamps

## 6. API Reference

Base prefix: `/api`

### 6.1 Config APIs

- `GET /configs` - list all configs
- `GET /configs/:id` - get one config
- `POST /configs` - create config
- `PUT /configs/:id` - update config
- `DELETE /configs/:id` - delete config and cascade delete payloads

Create example:

```json
{
  "name": "Create User",
  "method": "POST",
  "url": "https://example.com/users",
  "headers": { "Content-Type": "application/json" },
  "queryParams": {}
}
```

### 6.2 Payload APIs

- `GET /payloads?configId=<configId>`
- `POST /payloads`
- `POST /payloads/bulk`
- `PUT /payloads/:id`
- `DELETE /payloads/:id`
- `DELETE /payloads/config/:configId`

Create example:

```json
{
  "configId": "6612cfa9a4a8f0f9d1f3f1aa",
  "name": "Null email",
  "body": { "email": null, "password": "pass123" },
  "isAiGenerated": true,
  "edgeCaseType": "null_values"
}
```

### 6.3 Runner APIs

- `POST /runner/run-one`
- `POST /runner/run-all`

`run-one` input:

```json
{
  "configId": "6612cfa9a4a8f0f9d1f3f1aa",
  "payloadId": "6612d02ba4a8f0f9d1f3f1bd"
}
```

`run-all` input:

```json
{
  "configId": "6612cfa9a4a8f0f9d1f3f1aa",
  "delayMs": 300
}
```

`run-all` output summary:

```json
{
  "summary": {
    "total": 10,
    "passed": 7,
    "failed": 3
  }
}
```

### 6.4 Report APIs

- `GET /reports`
- `GET /reports?configId=<configId>`
- `GET /reports/:id`
- `DELETE /reports/:id`

### 6.5 AI APIs

- `POST /ai/generate-edge-cases`
- `POST /ai/analyze-flow`

`generate-edge-cases` input:

```json
{
  "configId": "6612cfa9a4a8f0f9d1f3f1aa",
  "method": "POST",
  "url": "https://example.com/users",
  "count": 10,
  "dto": {
    "email": "string",
    "password": "string"
  }
}
```

Important behavior:

- AI response is expected as JSON and sanitized/parsing is retried
- generated payloads are inserted into MongoDB directly

### 6.6 Swagger APIs

- `POST /swagger/parse` with either:
  - `{ "url": "https://.../openapi.json" }`
  - `{ "content": "{...json...}" }`
- `POST /swagger/import` with parsed `endpoints[]` + `baseUrl`

Notes:

- parser supports direct spec URLs and `swagger-ui-init.js` extraction
- import creates `ApiConfig` records with default `Content-Type: application/json`

### 6.7 Postman APIs

- `POST /postman/parse` with either `url` or `content`
- `POST /postman/import`

Notes:

- nested folders are flattened
- unsupported methods are skipped
- absolute endpoint URLs are preserved when provided

### 6.8 Flow APIs

- `GET /flows`
- `GET /flows/:id`
- `POST /flows`
- `PUT /flows/:id`
- `DELETE /flows/:id`
- `POST /flows/:id/run`

Flow execution behavior:

- each step executes sequentially
- placeholders like `{{token}}` are replaced from runtime variable map
- values are extracted from response JSON paths (dot notation after `$.`)
- flow-level and step-level inject variables are merged (step overrides flow)
- `lastRunResult` is persisted on the flow

### 6.9 Bug APIs

- `GET /bugs/config` - returns which integrations are configured
- `POST /bugs/github` - creates one GitHub issue per result item
- `POST /bugs/jira` - creates one Jira issue per result item

`/bugs/github` and `/bugs/jira` input:

```json
{
  "reportName": "Create User Regression",
  "reportUrl": "http://localhost:8080/reports/123",
  "results": [
    {
      "payloadName": "Null email",
      "statusCode": 400,
      "statusText": "Bad Request",
      "latencyMs": 102,
      "payloadBody": { "email": null },
      "response": { "error": "email required" },
      "passed": false
    }
  ]
}
```

## 7. Error Handling Contract

Default error response format:

```json
{
  "error": "message"
}
```

Possible error classes:

- validation errors (`400`)
- resource not found (`404`)
- upstream provider errors (GitHub/Jira specific status passthrough)
- generic unhandled server errors (`500`)

## 8. Local Development

### 8.1 Backend only

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 8.2 Full stack

From repository root:

```bash
docker compose up --build
```

Access:

- frontend: `http://localhost:8080`
- backend: `http://localhost:5001`
- mongo: `mongodb://localhost:27017`

## 9. Production and Release Notes

- Backend image is built from `backend/Dockerfile`
- CI pipeline (`.github/workflows/docker-publish.yml`) publishes multi-arch images to GHCR
- Keep secret values in runtime environment or CI secrets, never in git

## 10. Troubleshooting Guide

### Backend starts then exits

- check `MONGODB_URI`
- verify Mongo container is healthy

### Browser gets CORS error

- set `FRONTEND_URLS` to include the exact frontend origin
- restart backend after env changes

### AI endpoint fails

- ensure `OPENAI_API_KEY` is present
- verify outbound access to OpenAI from runtime network

### `/api` calls fail in Docker

- verify frontend Nginx proxy settings in `frontend/nginx.conf`
- ensure backend container is named `backend` in compose network
