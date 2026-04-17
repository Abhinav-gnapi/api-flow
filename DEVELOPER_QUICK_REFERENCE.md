# Developer Quick Reference Guide

A fast lookup guide for common tasks and API endpoints.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Database Schemas at a Glance](#database-schemas-at-a-glance)
4. [Frontend Routes](#frontend-routes)
5. [Common Development Tasks](#common-development-tasks)
6. [Debugging Tips](#debugging-tips)
7. [Code Organization Cheat Sheet](#code-organization-cheat-sheet)

---

## Project Setup

### First Time Setup

```bash
# Clone repository
git clone https://github.com/Abhinav-gnapi/api-flow.git
cd api-flow-tester

# Install dependencies
npm run install:all

# Setup environment
cd backend && cp .env.example .env
# Edit .env with your keys:
# - MONGODB_URI
# - GEMINI_API_KEY
# - FRONTEND_URLS
cd ../frontend && cp .env.example .env

# Start development
npm run dev
```

### Ports

| Service | Development | Docker | Notes |
|---------|------------|--------|-------|
| Frontend | localhost:5174 | localhost:8081 | Vite dev server |
| Backend | localhost:5000 | localhost:5001 → 5000 | Express |
| MongoDB | localhost:27017 | 27017 | Same in both |

---

## API Endpoints Reference

### API Configuration Management

```bash
# List all configs
GET /api/configs

# Create new config
POST /api/configs
Body: {
  "name": "User Login",
  "method": "POST",
  "url": "https://api.example.com/auth/login",
  "headers": { "Content-Type": "application/json" },
  "queryParams": {}
}

# Get single config
GET /api/configs/:id

# Update config
PUT /api/configs/:id
Body: { ...updates }

# Delete config
DELETE /api/configs/:id
```

### Payloads (Test Cases)

```bash
# Create payload
POST /api/payloads
Body: {
  "configId": "ObjectId",
  "body": { "email": "test@example.com", "password": "pass123" },
  "expectedResponse": { "status": 200 },
  "description": "Valid login",
  "isGenerated": false
}

# Get payloads for config
GET /api/payloads?configId=ObjectId

# Delete payload
DELETE /api/payloads/:id
```

### Test Execution

```bash
# Execute single test
POST /api/runner/execute
Body: {
  "configId": "ObjectId",
  "payload": { "email": "user@example.com", "password": "pass" }
}

Response: {
  "actualResponse": { ...response data },
  "latency": 245,
  "status": 200,
  "passed": true
}
```

### Reports

```bash
# Generate report
POST /api/reports/generate
Body: {
  "configId": "ObjectId",
  "payloadIds": ["id1", "id2", "id3"]
}

Response: {
  "_id": "reportId",
  "configId": "ObjectId",
  "payloads": [
    { "payloadId": "id1", "passed": true, "latency": 245 },
    { "payloadId": "id2", "passed": false, "latency": 156 }
  ],
  "summary": { "totalTests": 2, "passed": 1, "failed": 1, "avgLatency": 200.5 }
}

# Get report
GET /api/reports/:id

# List reports
GET /api/reports?configId=ObjectId
```

### AI Edge Case Generation

```bash
# Generate edge cases
POST /api/ai/generate
Body: {
  "configId": "ObjectId",
  "payload": { "email": "user@example.com" }
}

Response: {
  "generated": [
    { "email": "'; DROP TABLE--" },
    { "email": "user+tag@example.com" },
    { "email": "user@example.c" },
    ...
  ]
}
```

### Flow Management

```bash
# Create flow
POST /api/flows
Body: {
  "name": "User Registration Flow",
  "description": "Register and get profile",
  "steps": [
    {
      "id": "step1",
      "name": "Register",
      "configId": "ObjectId",
      "method": "POST",
      "url": "https://api.example.com/register",
      "body": { "email": "user@example.com" },
      "extractVariables": { "userId": "$.data.id", "token": "$.data.token" }
    }
  ]
}

# Execute flow
POST /api/flows/:id/execute

Response: {
  "steps": [
    {
      "stepId": "step1",
      "response": { ... },
      "latency": 245,
      "extractedVariables": { "userId": 123, "token": "abc" },
      "status": "success"
    }
  ]
}
```

### Swagger/OpenAPI Import

```bash
# Import swagger spec
POST /api/swagger/import
Body (FormData): {
  "file": <swagger.json or swagger.yaml>
}

Response: {
  "created": 5,
  "configs": [ ... ],
  "message": "Successfully created 5 API configs"
}
```

### Postman Import

```bash
# Import Postman collection
POST /api/postman/import
Body (FormData): {
  "file": <collection.json>
}

Response: {
  "created": 3,
  "message": "Successfully imported 3 requests"
}
```

### Issue Creation

```bash
# Create GitHub issue from failed test
POST /api/bugs/github
Body: {
  "reportId": "ObjectId",
  "title": "Test Failed: User Login",
  "failedPayloads": [{ payloadId, actualResponse }]
}

Response: {
  "issueUrl": "https://github.com/owner/repo/issues/45"
}

# Create Jira issue
POST /api/bugs/jira
Body: {
  "reportId": "ObjectId",
  "summary": "Test Failed: User Login",
  ...
}

Response: {
  "issueKey": "PROJ-123",
  "issueUrl": "https://your-domain.atlassian.net/browse/PROJ-123"
}
```

### Health

```bash
GET /health

Response: { 
  "status": "ok", 
  "timestamp": "2024-01-15T10:30:00Z" 
}
```

---

## Database Schemas at a Glance

### ApiConfig

```javascript
{
  _id: ObjectId,
  name: String,                    // "User Login"
  method: String,                  // "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: String,                     // "https://api.example.com/auth/login"
  headers: Object,                 // { "Authorization": "Bearer ..." }
  queryParams: Object,             // { "apiKey": "xyz" }
  lastRun: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Payload

```javascript
{
  _id: ObjectId,
  configId: ObjectId,              // Reference to ApiConfig
  body: Mixed,                     // Request body/data
  expectedResponse: Mixed,         // Expected response for validation
  description: String,             // "Valid login with correct credentials"
  isGenerated: Boolean,            // true if created by AI
  createdAt: Date,
  updatedAt: Date
}
```

### Report

```javascript
{
  _id: ObjectId,
  configId: ObjectId,              // Reference to ApiConfig
  payloads: [{
    payloadId: ObjectId,
    passed: Boolean,
    actualResponse: Mixed,
    latency: Number,               // Milliseconds
    error: String                  // Error message if failed
  }],
  summary: {
    totalTests: Number,
    passed: Number,
    failed: Number,
    avgLatency: Number             // Average in milliseconds
  },
  executedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Flow

```javascript
{
  _id: ObjectId,
  name: String,                    // "User Registration Flow"
  description: String,
  globalInjectVariables: Object,   // { "apiKey": "env_key" }
  steps: [{
    id: String,                    // "step1"
    name: String,                  // "Register User"
    configId: ObjectId,            // Reference to ApiConfig
    method: String,
    url: String,                   // Can include {{variables}}
    headers: Object,
    body: Object,
    extractVariables: Object,      // { "userId": "$.data.id" }
    injectVariables: Object,       // { "Authorization": "Bearer {{token}}" }
    position: { x: Number, y: Number },
    nextStepId: String             // ID of next step or null
  }],
  lastRunResult: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Routes

```javascript
/                       - Dashboard (list configs)
/config/:id             - Config Editor (3-panel view)
/report/:id             - Report Viewer
/swagger                - Swagger/OpenAPI Importer
/postman                - Postman Collection Importer
/flows                  - Flow Designer (list)
/flows/:id              - Flow Designer (edit specific flow)
/execution              - Execution Results Viewer
```

---

## Common Development Tasks

### Add New API Endpoint

1. **Create controller** → `backend/src/controllers/newFeature.controller.js`
2. **Create routes** → `backend/src/routes/newFeature.routes.js`
3. **Mount in index.js** → `app.use('/api/newFeature', newFeatureRoutes)`
4. **Test with Postman or curl**

### Add New Frontend Page

1. **Create page** → `frontend/src/pages/NewPage.jsx`
2. **Update routes** → `frontend/src/App.jsx` (add Route)
3. **Add sidebar link** → `frontend/src/components/layout/Layout.jsx`
4. **Create API service methods** → `frontend/src/services/api.js`

### Add New Database Model

1. **Create model** → `backend/src/models/Model.model.js`
2. **Export in controller** → `const Model = require('../models/Model.model')`
3. **Use in queries** → `await Model.find()`, `await Model.create(data)`, etc.

### Query MongoDB Locally

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/api-flow-tester

# List collections
show collections

# Query configs
db.apiconfigs.find().pretty()

# Query payloads
db.payloads.find().pretty()

# Find by ID
db.apiconfigs.findOne({ _id: ObjectId("...") })

# Count documents
db.apiconfigs.countDocuments()

# Delete all (careful!)
db.apiconfigs.deleteMany({})
```

### Debug Backend Issues

```bash
# Tail logs (Docker)
docker-compose logs -f backend

# Use Node debugger
node --inspect src/index.js
# Open chrome://inspect

# Add console logs
console.log('Debug:', variable);

# Add error context
console.error('Error in step:', err.message, err.stack);
```

### Test API Locally

```bash
# Using curl
curl -X POST http://localhost:5000/api/configs \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","method":"GET","url":"https://api.example.com"}'

# Using Postman
1. Create request
2. Set URL: http://localhost:5000/api/...
3. Set method
4. Set body (JSON)
5. Send

# Using VSCode REST Client
# Create file: test.http
POST http://localhost:5000/api/configs
Content-Type: application/json

{
  "name": "Test",
  "method": "GET",
  "url": "https://api.example.com"
}
```

### Build Docker Image

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Tag for registry
docker tag apiflow-backend:local myregistry/apiflow-backend:1.0
docker push myregistry/apiflow-backend:1.0
```

### Deploy to Production

```bash
# With Docker Compose
docker-compose -f docker-compose.yml up -d

# Scale backend (if using orchestration)
docker-compose up -d --scale backend=3

# View status
docker-compose ps

# Stop
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

---

## Debugging Tips

### Issue: CORS Error in Frontend

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```bash
# Check backend CORS config (backend/src/index.js)
FRONTEND_URLS should include current frontend URL

# In .env:
FRONTEND_URLS=http://localhost:5174,http://localhost:8081
```

### Issue: MongoDB Connection Failed

**Error**: `❌ MongoDB connection failed: connect ECONNREFUSED`

**Solution**:
```bash
# Ensure MongoDB is running
mongod

# Or using Docker
docker-compose up -d mongodb

# Check MONGODB_URI is correct in .env
MONGODB_URI=mongodb://localhost:27017/api-flow-tester
```

### Issue: Empty Response from API

**Debugging**:
```javascript
// In controller
console.log('Received payload:', req.body);
console.log('Query params:', req.query);

// Check request headers
console.log('Headers:', req.headers);
```

### Issue: Latency Always 0

**Debugging**:
```javascript
// Ensure using Date.now() correctly
const start = Date.now();
await someAsyncOperation();
const latency = Date.now() - start;  // Should be > 0
```

### Issue: Variables Not Injected in Flow

**Debugging**:
```javascript
// Check JSONPath extraction
console.log('Response:', response.data);
console.log('Extracted:', jp.query(response.data, "$.data.id"));

// Check template replacement
const injected = url.replace(/\{\{varName\}\}/g, value);
console.log('After injection:', injected);
```

---

## Code Organization Cheat Sheet

### Backend File Structure

```
backend/
├── src/
│   ├── index.js                      # Entry point, middleware setup
│   ├── controllers/
│   │   ├── apiConfig.controller.js   # Config CRUD logic
│   │   ├── payload.controller.js     # Payload CRUD logic
│   │   ├── runner.controller.js      # Test execution logic
│   │   ├── report.controller.js      # Report generation logic
│   │   ├── ai.controller.js          # AI integration logic
│   │   ├── swagger.controller.js     # Swagger parser logic
│   │   ├── postman.controller.js     # Postman parser logic
│   │   ├── flow.controller.js        # Flow execution logic
│   │   └── bug.controller.js         # Bug tracking integration
│   ├── models/
│   │   ├── ApiConfig.model.js        # Mongoose schema for configs
│   │   ├── Payload.model.js          # Mongoose schema for payloads
│   │   ├── Report.model.js           # Mongoose schema for reports
│   │   └── Flow.model.js             # Mongoose schema for flows
│   └── routes/
│       ├── apiConfig.routes.js       # Config endpoints
│       ├── payload.routes.js         # Payload endpoints
│       ├── runner.routes.js          # Execution endpoints
│       ├── report.routes.js          # Report endpoints
│       ├── ai.routes.js              # AI endpoints
│       ├── swagger.routes.js         # Swagger endpoints
│       ├── postman.routes.js         # Postman endpoints
│       ├── flow.routes.js            # Flow endpoints
│       └── bug.routes.js             # Bug endpoints
├── Dockerfile
├── package.json
└── .env.example
```

### Frontend File Structure

```
frontend/
├── src/
│   ├── main.jsx                      # React entry point
│   ├── App.jsx                       # Route definitions
│   ├── index.css                     # Global styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx            # Main layout + sidebar
│   │   │   └── Layout.module.css
│   │   └── ui/
│   │       ├── index.jsx             # Custom UI components
│   │       └── UI.module.css
│   ├── pages/
│   │   ├── DashboardPage.jsx         # Config list & create
│   │   ├── ConfigEditorPage.jsx      # 3-panel editor
│   │   ├── ReportPage.jsx            # Report viewer
│   │   ├── FlowDesignerPage.jsx      # Flow builder
│   │   ├── SwaggerPage.jsx           # Swagger importer
│   │   ├── PostmanPage.jsx           # Postman importer
│   │   └── ExecutionResults.jsx      # Results viewer
│   ├── services/
│   │   ├── api.js                    # Axios + all API calls
│   │   └── reportService.js          # Report-specific helpers
│   └── theme/
│       ├── muiTheme.js               # MUI theme config
│       ├── palette.js                # Color palette
│       ├── typography.js             # Font config
│       ├── applyTypography.js        # Apply fonts globally
│       └── useInlinePageStyles.js    # Dynamic style hooks
├── Dockerfile
├── nginx.conf                        # Nginx config (Docker)
├── vite.config.js                    # Vite config
├── package.json
└── .env.example
```

### Environment Variables Quick Reference

**Backend `.env`**:
```env
PORT=5000
NODE_ENV=production|development
MONGODB_URI=mongodb://localhost:27017/api-flow-tester
FRONTEND_URLS=http://localhost:5174
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-proj-...
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=org-name
GITHUB_REPO=repo-name
JIRA_HOST=https://domain.atlassian.net
JIRA_EMAIL=email@example.com
JIRA_API_TOKEN=...
JIRA_PROJECT_KEY=PROJ
```

**Frontend `.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Quick Command Reference

```bash
# Development
npm run install:all              # Install all deps
npm run dev                      # Start both servers
npm run dev:backend              # Backend only
npm run dev:frontend             # Frontend only

# Backend specific
cd backend && npm run dev        # With nodemon
cd backend && npm start          # Production

# Frontend specific
cd frontend && npm run dev       # Vite dev server
cd frontend && npm run build     # Production build
cd frontend && npm run preview   # Preview build

# Docker
docker-compose build             # Build images
docker-compose up -d             # Start stack
docker-compose down              # Stop stack
docker-compose logs -f backend   # View logs
docker-compose ps                # View status

# MongoDB
mongosh mongodb://localhost:27017/api-flow-tester
show collections
db.apiconfigs.find().pretty()
```

---

**Last Updated**: 2024
**Version**: 1.0
