# System Architecture & How It All Works

A comprehensive guide to the API Flow Tester system architecture, data models, request flows, and feature modules.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [Data Models](#data-models)
6. [Request Flow Patterns](#request-flow-patterns)
7. [Feature Modules](#feature-modules)
8. [Deployment Architecture](#deployment-architecture)
9. [Development Workflow](#development-workflow)

---

## System Overview

**API Flow Tester** is a full-stack AI-powered API testing platform that enables users to:

- **Test APIs** with payloads and capture responses
- **Generate edge cases** using AI (Google Gemini 2.0 Flash)
- **Design complex flows** with multi-step API chains and variable passing
- **Import API specs** from Swagger/OpenAPI and Postman collections
- **Generate reports** with detailed test results, latency metrics, and pass/fail analysis
- **Create issues** in GitHub and Jira from failed tests
- **Visualize flows** with drag-and-drop UI using ReactFlow

---

## High-Level Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│  React 18 + Vite + React Router                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pages:                                                    │  │
│  │  • Dashboard (Config Management)                          │  │
│  │  • Config Editor (3-panel: Payloads | Config | Response) │  │
│  │  • Report Viewer (Results & Analytics)                   │  │
│  │  • Flow Designer (Drag-and-drop Flow Builder)            │  │
│  │  • Swagger/Postman Importer                              │  │
│  │  • Execution Results Viewer                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Material UI (MUI) + ReactFlow + CodeMirror 6                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓ (HTTPS/Axios)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER (Express)                   │
├──────────────────────────────────────────────────────────────────┤
│  Node.js + Express.js on Port 5000                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes:                                              │   │
│  │  • /api/configs      - API Configuration Management      │   │
│  │  • /api/payloads     - Test Payload Management           │   │
│  │  • /api/runner       - Test Execution Engine             │   │
│  │  • /api/reports      - Report Generation & Storage       │   │
│  │  • /api/ai           - AI Edge Case Generation           │   │
│  │  • /api/swagger      - Swagger/OpenAPI Parser            │   │
│  │  • /api/postman      - Postman Collection Parser         │   │
│  │  • /api/flows        - Multi-step Flow Execution         │   │
│  │  • /api/bugs         - GitHub/Jira Integration           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Middleware: CORS, JSON Parser, Error Handler                   │
└─────────────────────────────────────────────────────────────────┘
        ↓ (drivers)
┌──────────────────────────────────────────┐  ┌──────────────────┐
│     DATABASE LAYER (MongoDB 7)           │  │  EXTERNAL APIs   │
├──────────────────────────────────────────┤  ├──────────────────┤
│  Collections:                            │  │ • Google Gemini  │
│  • api_configs                           │  │ • GitHub API     │
│  • payloads                              │  │ • Jira API       │
│  • reports                               │  │ • Target APIs    │
│  • flows                                 │  │   (User's APIs)  │
│  • requests (execution logs)             │  └──────────────────┘
│  Docker: mongo:7 container               │
│  Persistent volume: /data/db              │
└──────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Interactive UI, hot module reload |
| **Frontend UI** | Material UI (MUI) | Component library, theming |
| **Flow Visualization** | ReactFlow | Drag-and-drop flow builder UI |
| **Code Editor** | CodeMirror 6 | JSON payload editing |
| **Frontend Routing** | React Router v6 | Page navigation & params |
| **HTTP Client** | Axios | Frontend → Backend API calls |
| **Notifications** | React Hot Toast | User feedback (success/error) |
| **State Management** | React Hooks | Local & component state |
| **Backend** | Express.js | REST API server |
| **Database Driver** | Mongoose ODM | MongoDB object modeling |
| **Database** | MongoDB 7 | Document storage (JSON-like) |
| **AI** | Google Generative AI | Edge case generation & analysis |
| **HTTP Client** | Axios | Backend → External API calls |
| **Environment** | dotenv | Configuration management |
| **CORS** | cors middleware | Cross-origin request handling |
| **Containerization** | Docker + Docker Compose | Orchestration & deployment |

---

## Core Components

### Frontend Components

#### Page-Level Components

1. **DashboardPage** (`pages/DashboardPage.jsx`)
   - Lists all API configurations
   - Create/update/delete configs
   - Quick access to test and flow design

2. **ConfigEditorPage** (`pages/ConfigEditorPage.jsx`)
   - 3-panel layout: Payloads | Config | Response
   - Edit request headers, query params, body
   - Generate and run payloads
   - View live responses

3. **FlowDesignerPage** (`pages/FlowDesignerPage.jsx`)
   - Drag-and-drop API flow builder (ReactFlow)
   - Connect endpoints in multi-step workflows
   - Configure variable injection & extraction
   - Global variable management

4. **ReportPage** (`pages/ReportPage.jsx`)
   - View test execution results
   - Pass/fail statistics
   - Latency metrics and performance
   - Create GitHub/Jira issues from failures

5. **SwaggerPage** (`pages/SwaggerPage.jsx`)
   - Parse and import OpenAPI/Swagger specs
   - Auto-generate API configs from spec

6. **PostmanPage** (`pages/PostmanPage.jsx`)
   - Import Postman collections
   - Auto-create configs and payloads

#### Layout Components

- **Layout** (`components/layout/Layout.jsx`) - Sidebar navigation, main content area
- **UI Components** (`components/ui/`) - Reusable buttons, modals, badges, etc.

#### Services

- **api.js** - Centralized Axios instance + all backend API calls
- **reportService.js** - Report-specific API helpers

---

### Backend Components

#### Models (Mongoose Schemas)

1. **ApiConfig** - Stores endpoint configuration
   ```javascript
   {
     name: String,
     method: GET|POST|PUT|PATCH|DELETE,
     url: String,
     headers: Object,
     queryParams: Object,
     lastRun: Date,
     timestamps: true
   }
   ```

2. **Payload** - Test case data
   ```javascript
   {
     configId: ObjectId (ref: ApiConfig),
     body: Mixed,
     expectedResponse: Mixed,
     description: String,
     isGenerated: Boolean,
     timestamps: true
   }
   ```

3. **Report** - Execution results
   ```javascript
   {
     configId: ObjectId (ref: ApiConfig),
     payloads: [{ payloadId, passed, actualResponse, latency }],
     summary: { totalTests, passed, failed },
     executedAt: Date,
     timestamps: true
   }
   ```

4. **Flow** - Multi-step workflow definition
   ```javascript
   {
     name: String,
     description: String,
     globalInjectVariables: Object,
     steps: [{
       id: String,
       name: String,
       configId: ObjectId,
       method, url, headers, body,
       extractVariables: Object,  // { "varName": "$.path.to.value" }
       injectVariables: Object,   // { "header": "{{varName}}" }
       position: { x, y },
       nextStepId: String
     }],
     lastRunResult: Mixed,
     timestamps: true
   }
   ```

#### Controllers

1. **apiConfig.controller.js**
   - CRUD operations for API configurations
   - Fetch, create, update, delete endpoints

2. **payload.controller.js**
   - CRUD operations for test payloads
   - Manage test cases

3. **runner.controller.js**
   - Execute single API call with payload
   - Measure latency and capture response
   - **Core logic**: Makes actual HTTP requests to user's endpoints

4. **report.controller.js**
   - Generate reports from test runs
   - Aggregate pass/fail metrics
   - Store execution history

5. **ai.controller.js**
   - Call Google Gemini API for edge case generation
   - Analyze payloads and suggest improvements
   - Generate test scenarios

6. **swagger.controller.js**
   - Parse OpenAPI/Swagger specs
   - Auto-generate ApiConfig entries from spec

7. **postman.controller.js**
   - Parse Postman collection JSON
   - Create configs and payloads from collection

8. **flow.controller.js**
   - Execute multi-step workflows
   - **Core logic**: Variable extraction from responses
   - Variable injection into next step requests
   - Error handling if a step fails

9. **bug.controller.js**
   - Create GitHub issues
   - Create Jira issues from failed tests

---

## Data Models

### ApiConfig (Endpoint Definition)

Represents a single API endpoint to be tested.

```
┌─ ApiConfig ─────────────────────┐
│ _id: ObjectId (unique)          │
│ name: "User Login"              │
│ method: "POST"                  │
│ url: "https://api.example.com/auth/login" │
│ headers: {                      │
│   "Content-Type": "application/json",     │
│   "Authorization": "Bearer ..."          │
│ }                               │
│ queryParams: {                  │
│   "apiKey": "xyz123"            │
│ }                               │
│ lastRun: Date                   │
│ createdAt: Date                 │
│ updatedAt: Date                 │
└─────────────────────────────────┘
```

### Payload (Test Case)

Represents test data for an endpoint.

```
┌─ Payload ──────────────────────────┐
│ _id: ObjectId                      │
│ configId: ObjectId (ref ApiConfig) │
│ body: {                            │
│   "email": "test@example.com",     │
│   "password": "securePass123"      │
│ }                                  │
│ expectedResponse: {                │
│   "status": 200,                   │
│   "body": { "token": "..." }       │
│ }                                  │
│ description: "Valid login flow"    │
│ isGenerated: false                 │
│ createdAt: Date                    │
└────────────────────────────────────┘
```

### Report (Execution Results)

Stores test execution results and metrics.

```
┌─ Report ───────────────────────────────┐
│ _id: ObjectId                          │
│ configId: ObjectId (ref ApiConfig)     │
│ payloads: [{                           │
│   payloadId: ObjectId,                 │
│   passed: true,                        │
│   actualResponse: { ... },             │
│   latency: 245,                  (ms)  │
│   error: null                          │
│ }]                                     │
│ summary: {                             │
│   totalTests: 5,                       │
│   passed: 4,                           │
│   failed: 1,                           │
│   avgLatency: 198.4                    │
│ }                                      │
│ executedAt: Date                       │
│ createdAt: Date                        │
└────────────────────────────────────────┘
```

### Flow (Multi-Step Workflow)

Orchestrates multiple API calls with variable passing.

```
┌─ Flow ──────────────────────────────────────┐
│ _id: ObjectId                               │
│ name: "User Registration Flow"              │
│ description: "Register user and get token"  │
│ globalInjectVariables: {                    │
│   "apiKey": "env_key_123"                   │
│ }                                           │
│ steps: [{                                   │
│   id: "step1",                              │
│   name: "Register User",                    │
│   configId: ObjectId,                       │
│   method: "POST",                           │
│   url: "https://api.example.com/register",  │
│   body: { "email": "{{userEmail}}", ... },  │
│   extractVariables: {                       │
│     "userId": "$.data.id",                  │
│     "token": "$.data.token"                 │
│   },                                        │
│   position: { x: 0, y: 0 }                  │
│ }, {                                        │
│   id: "step2",                              │
│   name: "Get User Profile",                 │
│   configId: ObjectId,                       │
│   method: "GET",                            │
│   url: "https://api.example.com/users/{{userId}}", │
│   injectVariables: {                        │
│     "Authorization": "Bearer {{token}}"     │
│   },                                        │
│   position: { x: 200, y: 0 }                │
│   nextStepId: null                          │
│ }]                                          │
│ lastRunResult: { ... }                      │
│ createdAt: Date                             │
└─────────────────────────────────────────────┘
```

---

## Request Flow Patterns

### Pattern 1: Simple API Test (Happy Path)

```
User → Dashboard → Select Config → Config Editor
    ↓
User writes payload in 3-panel editor
    ↓
User clicks "Run Test" button
    ↓
Frontend (axios) → POST /api/runner { configId, payload }
    ↓
Backend (runner.controller.js):
  1. Fetch ApiConfig from MongoDB
  2. Make HTTP request to target endpoint
  3. Capture response + latency
  4. Return { actualResponse, latency, status }
    ↓
Frontend displays response in 3rd panel → User sees pass/fail
```

### Pattern 2: Generate Edge Cases with AI

```
User → Config Editor → "Generate Payloads" button
    ↓
Frontend → POST /api/ai/generate { configId, payload }
    ↓
Backend (ai.controller.js):
  1. Fetch current payload from MongoDB
  2. Call Google Gemini 2.0 API
  3. Gemini returns edge cases (JSON array)
  4. Save payloads to MongoDB
  5. Return generated payloads
    ↓
Frontend displays new payloads in list → User can test them
```

### Pattern 3: Execute Multi-Step Flow

```
User → Flow Designer → Design workflow with 3 steps → Save
    ↓
User → Flow Designer → Click "Execute Flow"
    ↓
Frontend → POST /api/flows/execute { flowId }
    ↓
Backend (flow.controller.js):
  1. Fetch Flow from MongoDB
  2. FOR EACH STEP:
     a. Prepare request with injected variables
     b. Execute step via runner (makes HTTP call)
     c. Extract variables from response using JSONPath
     d. Pass to next step
     e. If error: stop and return error
  3. Aggregate all step results
  4. Save lastRunResult to Flow
  5. Return complete execution log
    ↓
Frontend displays step-by-step results with latencies
```

### Pattern 4: Import Swagger and Auto-Generate Configs

```
User → Swagger Page → Upload OpenAPI JSON/YAML
    ↓
Frontend → POST /api/swagger/import { specFile }
    ↓
Backend (swagger.controller.js):
  1. Parse spec file (swagger-parser lib)
  2. FOR EACH endpoint in spec:
     a. Extract method, path, parameters, schema
     b. Create ApiConfig entry
     c. Create sample Payload entries
  3. Save to MongoDB
  4. Return list of created configs
    ↓
Frontend shows "Created X configs" → User can test immediately
```

### Pattern 5: Generate Test Report

```
User → Config Editor → Select multiple payloads → "Run All"
    ↓
Frontend → POST /api/reports/generate { configId, payloadIds }
    ↓
Backend (report.controller.js):
  1. FOR EACH payload:
     a. Execute via runner.controller
     b. Compare actual vs expected response
     c. Determine pass/fail
     d. Record latency
  2. Aggregate summary stats
  3. Create Report entry in MongoDB
  4. Return report
    ↓
Frontend → User navigates to Report Page
    ↓
Report Page displays:
  • Summary: "5/6 tests passed"
  • Table: Each test with latency and status
  • Charts: Performance metrics
  • Action: Create GitHub/Jira issue for failures
```

---

## Feature Modules

### 1. API Configuration Management

**Purpose**: Store and manage API endpoints to be tested.

**Workflow**:
1. User creates config via Dashboard: `POST /api/configs`
2. Backend stores in MongoDB
3. User can edit headers, query params, URL
4. Config is referenced by payloads and flows

**Key Files**:
- [backend/src/controllers/apiConfig.controller.js](backend/src/controllers/apiConfig.controller.js)
- [backend/src/models/ApiConfig.model.js](backend/src/models/ApiConfig.model.js)
- [frontend/src/pages/DashboardPage.jsx](frontend/src/pages/DashboardPage.jsx)

---

### 2. Test Execution Engine

**Purpose**: Execute test payloads against real endpoints.

**Workflow**:
1. User selects payload in Config Editor
2. Frontend sends: `POST /api/runner/execute`
3. Backend makes actual HTTP request
4. Measures latency and captures response
5. Returns pass/fail + metrics

**Key Files**:
- [backend/src/controllers/runner.controller.js](backend/src/controllers/runner.controller.js)
- [frontend/src/pages/ConfigEditorPage.jsx](frontend/src/pages/ConfigEditorPage.jsx)

**Latency Measurement**:
```javascript
const startTime = Date.now();
const response = await axios(requestConfig);
const latency = Date.now() - startTime;
```

---

### 3. AI Edge Case Generation

**Purpose**: Use AI to generate edge cases and corner case payloads.

**Workflow**:
1. User selects payload and clicks "Generate Edge Cases"
2. Frontend sends: `POST /api/ai/generate { configId, payload }`
3. Backend calls Google Gemini 2.0 Flash API
4. Gemini generates JSON array of edge cases
5. Backend saves new payloads to MongoDB
6. Frontend displays generated payloads

**Key Files**:
- [backend/src/controllers/ai.controller.js](backend/src/controllers/ai.controller.js)
- Uses: `@google/generative-ai` library
- Environment: `GEMINI_API_KEY` from `.env`

**Example Prompt**:
```
Given this API endpoint: POST /api/login
And this payload: { "email": "user@example.com", "password": "pass123" }

Generate 5 edge case payloads for testing:
- SQL injection attempts
- Invalid format/type
- Missing required fields
- Extreme values
- Special characters
```

---

### 4. Multi-Step Flow Execution

**Purpose**: Chain multiple API calls with variable passing between steps.

**Workflow**:
1. User designs flow in Flow Designer (drag-drop endpoints)
2. User configures variable extraction: `{ "token": "$.data.token" }`
3. User configures variable injection: `{ "Authorization": "Bearer {{token}}" }`
4. User clicks "Execute Flow"
5. Backend executes each step sequentially:
   - Execute step 1, extract variables
   - Pass variables to step 2, inject into request
   - Repeat for all steps
6. Return complete execution log with all responses

**Key Files**:
- [backend/src/controllers/flow.controller.js](backend/src/controllers/flow.controller.js)
- [backend/src/models/Flow.model.js](backend/src/models/Flow.model.js)
- [frontend/src/pages/FlowDesignerPage.jsx](frontend/src/pages/FlowDesignerPage.jsx)

**Variable Extraction**: Uses JSONPath library to parse responses
```javascript
const token = jp.query(response.data, "$.data.token")[0];
```

**Variable Injection**: Uses template string replacement
```javascript
const url = "https://api.example.com/users/{{userId}}"
  .replace(/\{\{userId\}\}/g, userId);
```

---

### 5. OpenAPI/Swagger Import

**Purpose**: Auto-generate API configs from Swagger/OpenAPI specifications.

**Workflow**:
1. User uploads Swagger JSON/YAML file to Swagger Page
2. Frontend sends: `POST /api/swagger/import { specFile }`
3. Backend parses spec using `swagger-parser` library
4. Extracts endpoints, methods, parameters, descriptions
5. Creates ApiConfig entry for each endpoint
6. Creates sample Payload entries for each config
7. Returns list of created configs

**Key Files**:
- [backend/src/controllers/swagger.controller.js](backend/src/controllers/swagger.controller.js)
- Uses: `swagger-parser` library

---

### 6. Postman Collection Import

**Purpose**: Auto-generate configs from Postman collections.

**Workflow**:
1. User uploads Postman collection JSON
2. Frontend sends: `POST /api/postman/import { collectionFile }`
3. Backend parses collection structure
4. Extracts requests, headers, body templates
5. Creates ApiConfig and Payload entries
6. Returns created items

**Key Files**:
- [backend/src/controllers/postman.controller.js](backend/src/controllers/postman.controller.js)

---

### 7. Report Generation & Analytics

**Purpose**: Run multiple tests and generate reports with metrics.

**Workflow**:
1. User selects multiple payloads → "Run All Tests"
2. Frontend sends: `POST /api/reports/generate { configId, payloadIds }`
3. Backend runs each payload sequentially
4. For each: captures response, latency, pass/fail
5. Aggregates: total/passed/failed counts, avg latency
6. Saves Report to MongoDB
7. Stores execution history

**Key Files**:
- [backend/src/controllers/report.controller.js](backend/src/controllers/report.controller.js)
- [backend/src/models/Report.model.js](backend/src/models/Report.model.js)
- [frontend/src/pages/ReportPage.jsx](frontend/src/pages/ReportPage.jsx)

**Report Contents**:
```javascript
{
  configId: ObjectId,
  payloads: [
    {
      payloadId: ObjectId,
      passed: true,
      actualResponse: { status: 200, data: {...} },
      latency: 245,
      error: null
    },
    ...
  ],
  summary: {
    totalTests: 10,
    passed: 9,
    failed: 1,
    avgLatency: 198.4
  },
  executedAt: "2024-01-15T10:30:00Z"
}
```

---

### 8. GitHub & Jira Issue Integration

**Purpose**: Create bug tickets from failed tests.

**Workflow**:
1. User views failed test in Report Page
2. User clicks "Create GitHub Issue" or "Create Jira Issue"
3. Frontend sends: `POST /api/bugs/github { reportId }` or `/api/bugs/jira`
4. Backend:
   - Fetches report and payload details
   - Formats issue title: "Test Failed: {configName}"
   - Includes: expected response, actual response, latency
   - Calls GitHub/Jira API to create issue
   - Returns issue link
5. Frontend displays link

**Key Files**:
- [backend/src/controllers/bug.controller.js](backend/src/controllers/bug.controller.js)
- Environment variables: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, etc.

---

## Deployment Architecture

### Development Setup

```
npm run install:all          # Install all dependencies
npm run dev                  # Concurrent dev servers

Outputs:
- Frontend: http://localhost:5174 (Vite dev server)
- Backend:  http://localhost:5000 (Express)
- MongoDB:  localhost:27017  (Local instance)
```

### Docker Compose Stack

**File**: [docker-compose.yml](docker-compose.yml)

**Services**:

1. **MongoDB** (mongo:7)
   - Port: 27017
   - Volume: mongo_data (persistent)
   - Initialization: Automatic

2. **Backend** (Express)
   - Port: 5001 (host) → 5000 (container)
   - Environment: MongoDB URI, CORS origins, API keys
   - Depends on: MongoDB
   - Health check: GET /health

3. **Frontend** (React + Nginx)
   - Port: 8081 (host) → 80 (container)
   - Nginx proxies `/api/*` to backend:5000
   - Built with: Vite (optimized production build)

**Build & Deploy**:
```bash
# Build images
docker-compose build

# Start stack
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop stack
docker-compose down
```

**URL after deployment**:
- Frontend: http://localhost:8081
- Backend: http://localhost:5001 (or internal: http://backend:5000)
- MongoDB: localhost:27017

---

### Environment Variables

**Backend** (`.env`):
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/api-flow-tester
FRONTEND_URLS=http://localhost:8081,http://localhost:4200
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=...
JIRA_PROJECT_KEY=PROJ
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: MongoDB (if local)
mongod

# Terminal 4: Watch logs
```

Backend starts on http://localhost:5000
Frontend starts on http://localhost:5174

### 2. Testing a Feature

**Example**: Adding a new endpoint to test AWS Lambda functions

```
1. Create new model (if needed):
   backend/src/models/Lambda.model.js

2. Create controller:
   backend/src/controllers/lambda.controller.js

3. Create routes:
   backend/src/routes/lambda.routes.js

4. Mount in index.js:
   app.use('/api/lambda', lambdaRoutes);

5. Create frontend pages:
   frontend/src/pages/LambdaPage.jsx

6. Update App.jsx routes

7. Test locally via Vite dev server

8. Build and test with Docker Compose
```

### 3. Adding New Feature Module

Example: Add "Database Query Tester" module

```
Backend Steps:
├── Create model: DbQuery.model.js
├── Create controller: dbQuery.controller.js
├── Create routes: dbQuery.routes.js
├── Mount routes in index.js
└── Add to MICROSERVICES.md documentation

Frontend Steps:
├── Create page: DbQueryPage.jsx
├── Create service methods in api.js
├── Add route to App.jsx
├── Add link to sidebar Layout.jsx
└── Test with npm run dev

Testing:
├── Unit test controller logic
├── Integration test with MongoDB
├── End-to-end with frontend
└── Docker Compose test
```

---

## Key Concepts

### Variable Extraction (JSONPath)

Used in Flow execution to extract values from API responses.

```javascript
// Response: { "data": { "userId": 123, "token": "abc" } }

extractVariables: {
  "userId": "$.data.userId",    // Extracts 123
  "token": "$.data.token"        // Extracts "abc"
}

// These variables become available for the next step
```

### Variable Injection (Template Replacement)

Used to pass extracted variables to next step requests.

```javascript
// From previous step, we extracted: userId = 123, token = "abc"

injectVariables: {
  "Authorization": "Bearer {{token}}",
  "X-User-Id": "{{userId}}"
}

// After replacement:
// "Authorization": "Bearer abc"
// "X-User-Id": "123"
```

### Latency Measurement

Captured for every API call for performance analysis.

```javascript
const startTime = Date.now();
const response = await axios(config);
const latency = Date.now() - startTime;  // Milliseconds
```

---

## Error Handling

### Backend Error Handler (Centralized)

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});
```

### Flow Execution Error Handling

If a step fails:
1. Stop execution
2. Return error message + failed step info
3. Log to database
4. Return HTTP 400 to frontend

---

## Monitoring & Logging

### Health Check

```bash
curl http://localhost:5000/health
# Response: { "status": "ok", "timestamp": "2024-01-15T10:30:00Z" }
```

### MongoDB Connection Logging

```javascript
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

### Request Logging

Use middleware (optional enhancement):
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
```

---

## Summary: Request Lifecycle

```
1. User Action
   ↓
2. Frontend (React) processes input
   ↓
3. Axios makes HTTP request to Backend
   ↓
4. Backend (Express & Middlewares)
   ├─ CORS validation
   ├─ JSON parsing
   ├─ Route matching
   ↓
5. Controller Logic
   ├─ Validate input
   ├─ Database read/write (MongoDB)
   ├─ External API calls (Gemini, GitHub, etc.)
   ├─ Core business logic
   ↓
6. Response Generation
   ├─ Status code
   ├─ JSON body
   ↓
7. Frontend displays result
   ├─ Update UI
   ├─ Show notifications (toast)
   ├─ Navigate if needed
   ↓
8. User sees outcome
```

---

## Performance Considerations

1. **Latency Measurement**: Critical for performance analysis
2. **Batch Payload Execution**: Reports can run many tests sequentially
3. **Variable Extraction**: JSONPath parsing on each step
4. **MongoDB Indexing**: Consider indexes on frequent queries
5. **API Rate Limiting**: Target endpoints are external, rate limits apply
6. **Concurrent Flows**: Consider limiting simultaneous executions

---

## Security Considerations

1. **CORS**: Configured to allow only specified frontend origins
2. **Environment Variables**: Sensitive keys (API keys, tokens) in `.env`, never in code
3. **MongoDB URI**: Connection string in environment
4. **Request Payloads**: 10MB limit to prevent attacks
5. **Error Messages**: Generic error responses (don't leak stack traces to frontend)

---

## Future Enhancements

1. **WebSocket Integration**: Real-time flow execution updates
2. **Caching**: Redis for frequently accessed configs
3. **Rate Limiting**: Per-user API limits
4. **Authentication**: User accounts and session management
5. **Async Execution**: Background job queue for long-running flows
6. **Event Streaming**: Kafka/RabbitMQ for event-driven architecture
7. **Performance Profiling**: Flamegraph analysis
8. **Load Testing**: Distributed test execution
9. **Mobile App**: React Native client
10. **VS Code Extension**: Design flows without leaving IDE

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: API Flow Tester Team
