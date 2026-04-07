# API Flow Tester

A full-stack AI-powered API testing platform. Test endpoints with AI-generated edge cases, visualize flows, and generate reports.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + React Router      |
| Backend  | Express.js (Node)                   |
| Database | MongoDB + Mongoose                  |
| AI       | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Flow UI  | ReactFlow                           |
| Editor   | CodeMirror 6                        |

---

## Project Structure

```
api-flow-tester/
├── frontend/                  # React + Vite app
│   └── src/
│       ├── components/
│       │   ├── ui/            # Button, Badge, Modal, etc.
│       │   └── layout/        # Sidebar layout
│       ├── pages/
│       │   ├── DashboardPage       # List & create API configs
│       │   ├── ConfigEditorPage    # 3-panel editor (payloads + config + response)
│       │   ├── ReportPage          # Run report with pass/fail results
│       │   ├── SwaggerPage         # Import OpenAPI/Swagger specs
│       │   └── FlowDesignerPage    # Drag-and-drop API flow builder
│       └── services/api.js         # All API calls (axios)
│
└── backend/                   # Express API server
    └── src/
        ├── models/
        │   ├── ApiConfig.model.js
        │   ├── Payload.model.js
        │   ├── Report.model.js
        │   └── Flow.model.js
        ├── controllers/
        │   ├── apiConfig.controller.js
        │   ├── payload.controller.js
        │   ├── runner.controller.js    # Executes payloads, measures latency
        │   ├── ai.controller.js        # Claude edge-case generation & flow analysis
        │   ├── report.controller.js
        │   ├── swagger.controller.js   # Parses OpenAPI specs
        │   └── flow.controller.js      # Flow execution with variable passing
        └── routes/
            └── *.routes.js
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### 2. Clone & install

```bash
git clone <your-repo>
cd api-flow-tester
npm run install:all
```

### 3. Configure environment

**Backend** — copy and fill in:
```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/api-flow-tester
GEMINI_API_KEY=AIza...                 # Get from aistudio.google.com
FRONTEND_URLS=http://localhost:5173,http://localhost:4200
```

**Frontend** — copy and fill in:
```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Run development servers

From the root:
```bash
npm run dev
```

This starts both:
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

---

## Features by Phase

### Phase 1 — Core Testing (Tickets 1.1–1.4)
- ✅ Create API configs (method, URL, headers, query params)
- ✅ Add/edit/delete JSON payloads per config
- ✅ Run individual payload or all payloads with delay
- ✅ AI edge-case generation (null values, SQL injection, boundary, XSS, type mismatches)
- ✅ Response viewer with status code + latency
- ✅ Auto-save reports on "Generate Report" run
- ✅ Expandable report rows showing payload sent + response received

### Phase 2 — Swagger Import (Tickets 2.1–2.2)
- ✅ Parse Swagger/OpenAPI URL (JSON/YAML)
- ✅ Select endpoints to import as API configs
- ✅ Schema extraction for AI prompt context

### Phase 3 — Visual Flow Designer (Tickets 3.1–3.2)
- ✅ Drag-and-drop step nodes (ReactFlow)
- ✅ Connect steps with animated edges
- ✅ Variable extraction from responses (`$.data.token`)
- ✅ Variable injection into next request (`{{token}}`)
- ✅ Sequential flow execution
- ✅ AI flow analysis: negative flows, dependencies, security concerns

---

## API Endpoints

```
GET    /api/configs           List all API configs
POST   /api/configs           Create config
PUT    /api/configs/:id       Update config
DELETE /api/configs/:id       Delete config + payloads

GET    /api/payloads?configId  Get payloads for config
POST   /api/payloads           Create payload
POST   /api/payloads/bulk      Bulk create (AI generated)
PUT    /api/payloads/:id       Update payload
DELETE /api/payloads/:id       Delete payload

POST   /api/runner/run-one    Execute single payload
POST   /api/runner/run-all    Execute all payloads + save report

GET    /api/reports?configId  List reports
GET    /api/reports/:id       Get single report

POST   /api/ai/generate-edge-cases   AI edge case generation
POST   /api/ai/analyze-flow          AI flow analysis

POST   /api/swagger/parse     Parse OpenAPI spec
POST   /api/swagger/import    Import endpoints as configs

GET    /api/flows             List flows
POST   /api/flows             Create flow
PUT    /api/flows/:id         Update flow (steps)
DELETE /api/flows/:id         Delete flow
POST   /api/flows/:id/run     Execute flow
```

---

## Docker

### Build individual images

From project root:

```bash
docker build -f backend/Dockerfile -t api-flow-tester-backend .
docker build -f frontend/Dockerfile -t api-flow-tester-frontend ./frontend
```

### Run full stack with Docker Compose

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:8080
- Backend:  http://localhost:5001 (or `BACKEND_PORT` if overridden)
- MongoDB:  mongodb://localhost:27017

Optional environment variables for backend can be passed from your shell before running compose:
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
- `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`

---

## Color Scheme

Matches the reference screenshots:

| Token              | Value     | Usage                    |
|--------------------|-----------|--------------------------|
| `--purple-600`     | `#7c3aed` | Primary buttons, active  |
| `--green-500`      | `#22c55e` | PASS badges              |
| `--red-500`        | `#ef4444` | FAIL badges, delete      |
| `--bg-page`        | `#f0f2f5` | Page background          |
| `--bg-card`        | `#ffffff` | Cards, panels            |
| `--border`         | `#e5e7eb` | All borders              |
