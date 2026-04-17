# Documentation Index & Quick Navigation

Master index for all system documentation. Start here to navigate to the right documentation for your needs.

---

## 📚 Documentation Overview

### 1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System Design & Architecture
   
   **What**: High-level system design, technologies, components, and data models
   
   **When to read**:
   - You're new to the project and want to understand the overall structure
   - You need to understand how different components fit together
   - You're planning major architectural changes
   
   **Contents**:
   - System overview and high-level architecture
   - Technology stack breakdown
   - Core components (frontend, backend, database)
   - Complete data models with examples
   - Request flow patterns for major features
   - Feature modules breakdown
   - Deployment architecture (Docker Compose)
   - Development workflow
   
   **Perfect for**: Architecture reviews, onboarding, system design decisions

---

### 2. **[DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md)** - Quick Lookup Guide

   **What**: Fast reference for common tasks, API endpoints, and debugging
   
   **When to read**:
   - You need API endpoint documentation
   - You're setting up the project for the first time
   - You need database schema reference
   - You're debugging an issue
   
   **Contents**:
   - Project setup instructions
   - All API endpoints with examples (curl, Postman)
   - Database schemas at a glance
   - Frontend routes
   - Common development tasks
   - Debugging tips and solutions
   - Code organization cheat sheet
   - Quick command reference
   
   **Perfect for**: Daily development, API integration, troubleshooting

---

### 3. **[DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md)** - Detailed Data & Process Flows

   **What**: Step-by-step breakdown of how data flows through major workflows
   
   **When to read**:
   - You need to understand exactly what happens when a user performs an action
   - You're debugging a specific feature
   - You need to implement similar functionality
   - You want to trace data transformations
   
   **Contents**:
   - How to read the document guide
   - Single API test execution flow (detailed)
   - Multi-step flow execution (with variable passing)
   - AI edge case generation (with API integration)
   - Report generation (with aggregation logic)
   - Swagger import (with parsing details)
   - Component interaction diagram
   - Data transformation examples
   
   **Perfect for**: Feature implementation, debugging, understanding workflows

---

## 🚀 Quick Start Navigation

### I'm new and want to understand the system
1. Start with [ARCHITECTURE.md](ARCHITECTURE.md) - Read "System Overview" and "High-Level Architecture"
2. Then read [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - Read "Core Workflow: Single API Test Execution"
3. Then read the README.md and MICROSERVICES.md files in the root

### I need to set up the project locally
1. [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Project Setup" section
2. Follow the commands step by step
3. Refer to "Common Development Tasks" if you get stuck

### I need to add a new feature
1. [ARCHITECTURE.md](ARCHITECTURE.md) - "Feature Modules" section to understand related features
2. [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - Pick similar workflow to see pattern
3. [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Add New API Endpoint" or "Add New Frontend Page"

### I'm debugging an API issue
1. [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "API Endpoints Reference"
2. [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - Find the workflow that uses that endpoint
3. Check "Debugging Tips" in DEVELOPER_QUICK_REFERENCE.md

### I need to understand how a specific workflow works
1. Go to [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md)
2. Find the workflow in table of contents
3. Read through "Step-by-Step Execution"
4. Check "Data Transformation Examples" for format details

### I want to understand database design
1. [ARCHITECTURE.md](ARCHITECTURE.md) - "Data Models" section
2. [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Database Schemas at a Glance"
3. [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - Section showing data creation/transformation

---

## 📋 Feature Module Documentation Map

### Configuration Management
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#1-api-configuration-management)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#api-configuration-management)
- **API Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#core-workflow-single-api-test-execution) Step 2-4

### Test Execution
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#2-test-execution-engine)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#test-execution)
- **Detailed Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#core-workflow-single-api-test-execution)

### Multi-Step Flows
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#4-multi-step-flow-execution)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#flow-management)
- **Detailed Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#workflow-multi-step-flow-execution)

### AI Edge Case Generation
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#3-ai-edge-case-generation)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#ai-edge-case-generation)
- **Detailed Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#workflow-ai-edge-case-generation)

### Test Reports
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#7-report-generation--analytics)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#reports)
- **Detailed Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#workflow-report-generation)

### Swagger/OpenAPI Import
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#5-openapiaswagger-import)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#swaggeropenapi-import)
- **Detailed Workflow**: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md#workflow-swagger-import)

### Postman Import
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#6-postman-collection-import)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#postman-import)

### GitHub & Jira Integration
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md#8-github--jira-issue-integration)
- **Quick Ref**: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md#issue-creation)

---

## 🔧 Common Tasks Matrix

| Task | Documentation | Section |
|------|---|---|
| First time setup | DEVELOPER_QUICK_REFERENCE | Project Setup |
| Start dev servers | DEVELOPER_QUICK_REFERENCE | Project Setup > Ports |
| Add new API endpoint | DEVELOPER_QUICK_REFERENCE | Common Development Tasks |
| Add new frontend page | DEVELOPER_QUICK_REFERENCE | Common Development Tasks |
| Query MongoDB | DEVELOPER_QUICK_REFERENCE | Common Development Tasks |
| Test API locally | DEVELOPER_QUICK_REFERENCE | Common Development Tasks |
| Deploy to Docker | DEVELOPER_QUICK_REFERENCE | Common Development Tasks |
| Fix CORS error | DEVELOPER_QUICK_REFERENCE | Debugging Tips |
| Fix MongoDB connection | DEVELOPER_QUICK_REFERENCE | Debugging Tips |
| Understand a workflow | DATA_FLOW_WORKFLOWS | Pick workflow section |
| See API responses | DATA_FLOW_WORKFLOWS | Data Transformation Examples |
| Understand architecture | ARCHITECTURE | High-Level Architecture |
| Understand data models | ARCHITECTURE | Data Models |
| Learn deployment | ARCHITECTURE | Deployment Architecture |

---

## 📊 System Components Quick Reference

### Frontend
- **Container**: React 18 + Vite
- **UI Framework**: Material UI (MUI)
- **Flow Visualization**: ReactFlow
- **Code Editing**: CodeMirror 6
- **Location**: `frontend/src/`
- **Docs**: See [ARCHITECTURE.md](ARCHITECTURE.md#frontend-components)

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Port**: 5000 (development) / 5000 (container)
- **Location**: `backend/src/`
- **Docs**: See [ARCHITECTURE.md](ARCHITECTURE.md#backend-components)

### External APIs
- **AI**: Google Generative AI (Gemini 2.0 Flash)
- **Issue Tracking**: GitHub & Jira
- **Config**: Environment variables
- **Docs**: See [ARCHITECTURE.md](ARCHITECTURE.md#8-github--jira-issue-integration)

---

## 🏗️ Code Organization Quick Map

### Backend File Structure
```
backend/src/
├── controllers/         # Business logic for each feature
│   ├── apiConfig.controller.js
│   ├── payload.controller.js
│   ├── runner.controller.js
│   ├── report.controller.js
│   ├── ai.controller.js
│   ├── swagger.controller.js
│   ├── postman.controller.js
│   ├── flow.controller.js
│   └── bug.controller.js
├── models/              # Mongoose schemas
│   ├── ApiConfig.model.js
│   ├── Payload.model.js
│   ├── Report.model.js
│   └── Flow.model.js
├── routes/              # Express route handlers
│   └── *.routes.js
└── index.js             # Server entry point
```
[See DEVELOPER_QUICK_REFERENCE.md for full structure](DEVELOPER_QUICK_REFERENCE.md#code-organization-cheat-sheet)

### Frontend File Structure
```
frontend/src/
├── pages/               # Page components
│   ├── DashboardPage.jsx
│   ├── ConfigEditorPage.jsx
│   ├── FlowDesignerPage.jsx
│   ├── ReportPage.jsx
│   ├── SwaggerPage.jsx
│   └── ...
├── components/          # Reusable components
│   ├── layout/
│   └── ui/
├── services/            # API integration
│   ├── api.js
│   └── reportService.js
└── theme/               # Styling & theming
```
[See DEVELOPER_QUICK_REFERENCE.md for full structure](DEVELOPER_QUICK_REFERENCE.md#code-organization-cheat-sheet)

---

## 📱 API Endpoints Quick Reference

**Base URL**: `http://localhost:5000/api`

### Configs
- `GET /configs` - List all
- `POST /configs` - Create
- `GET /configs/:id` - Get one
- `PUT /configs/:id` - Update
- `DELETE /configs/:id` - Delete

### Payloads
- `POST /payloads` - Create
- `GET /payloads?configId=id` - Get for config
- `DELETE /payloads/:id` - Delete

### Runner (Execution)
- `POST /runner/execute` - Run single test

### Reports
- `POST /reports/generate` - Generate report
- `GET /reports/:id` - Get report
- `GET /reports?configId=id` - List for config

### Flows
- `POST /flows` - Create
- `POST /flows/:id/execute` - Execute
- `GET /flows/:id` - Get one
- `PUT /flows/:id` - Update

### AI
- `POST /ai/generate` - Generate edge cases

### Import
- `POST /swagger/import` - Import Swagger
- `POST /postman/import` - Import Postman

### Issues
- `POST /bugs/github` - Create GitHub issue
- `POST /bugs/jira` - Create Jira issue

[See DEVELOPER_QUICK_REFERENCE.md for full details with examples](DEVELOPER_QUICK_REFERENCE.md#api-endpoints-reference)

---

## 🗄️ Database Collections

### Collections in MongoDB
- `apiconfigs` - API endpoint configurations
- `payloads` - Test case data
- `reports` - Test execution results
- `flows` - Multi-step workflow definitions

[See DEVELOPER_QUICK_REFERENCE.md for schemas](DEVELOPER_QUICK_REFERENCE.md#database-schemas-at-a-glance)

---

## 🌐 Frontend Routes

```
/                    - Dashboard
/config/:id          - Config Editor
/report/:id          - Report Viewer
/swagger             - Swagger Importer
/postman             - Postman Importer
/flows               - Flow List
/flows/:id           - Flow Designer
/execution           - Execution Results
```

[See DEVELOPER_QUICK_REFERENCE.md for details](DEVELOPER_QUICK_REFERENCE.md#frontend-routes)

---

## 🐛 Debugging Quick Links

- **CORS Error**: [DEVELOPER_QUICK_REFERENCE.md - Debugging Tips](DEVELOPER_QUICK_REFERENCE.md#issue-cors-error-in-frontend)
- **MongoDB Connection Failed**: [DEVELOPER_QUICK_REFERENCE.md - Debugging Tips](DEVELOPER_QUICK_REFERENCE.md#issue-mongodb-connection-failed)
- **Empty Response**: [DEVELOPER_QUICK_REFERENCE.md - Debugging Tips](DEVELOPER_QUICK_REFERENCE.md#issue-empty-response-from-api)
- **Variables Not Injected**: [DEVELOPER_QUICK_REFERENCE.md - Debugging Tips](DEVELOPER_QUICK_REFERENCE.md#issue-variables-not-injected-in-flow)

---

## 📚 Related Documentation

### In Repository
- `README.md` - Project overview and quick start
- `MICROSERVICES.md` - Microservice architecture and Docker setup
- `backend/README.md` - Backend API documentation
- `docker-compose.yml` - Deployment configuration
- `.env.example` - Environment variables template

### This Documentation
- **ARCHITECTURE.md** - System design (read first)
- **DEVELOPER_QUICK_REFERENCE.md** - Developer handbook
- **DATA_FLOW_WORKFLOWS.md** - Process flows and data transformations
- **DOCUMENTATION_INDEX.md** - This file (navigation guide)

---

## 🎓 Learning Paths

### For Backend Developers
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - "Backend Components"
2. Explore: `backend/src/` folder structure
3. Study: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "API Endpoints Reference"
4. Learn: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - Pick a workflow
5. Code: Try adding a simple endpoint

### For Frontend Developers
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - "Frontend Components"
2. Explore: `frontend/src/` folder structure
3. Study: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Frontend Routes"
4. Learn: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - "Core Workflow"
5. Code: Try adding a new page

### For Full Stack Developers
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - "System Overview" & "High-Level Architecture"
2. Setup: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Project Setup"
3. Understand: [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) - All workflows
4. Explore: All code files mentioned in docs
5. Code: Try adding a complete feature (frontend + backend)

### For DevOps/Infrastructure
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - "Deployment Architecture"
2. Study: `docker-compose.yml` and Dockerfiles
3. Reference: `MICROSERVICES.md` - "Service Catalog"
4. Verify: [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - "Build Docker Image"

---

## 💡 Documentation Writing Guidelines

When updating or adding documentation:

1. **Clarity First**: Use simple, clear language. Avoid jargon unless necessary.
2. **Examples**: Include code snippets and real-world examples.
3. **Structure**: Use headers, bullet points, and tables for readability.
4. **Links**: Cross-reference related documentation sections.
5. **Diagrams**: Use ASCII art or text-based diagrams where helpful.
6. **Keep Updated**: Update docs when code changes.

---

## ✅ Documentation Checklist

Use this checklist before committing documentation:

- [ ] Code examples are accurate and runnable
- [ ] Links to files and sections work correctly
- [ ] Grammar and spelling are correct
- [ ] Diagrams are clear and professional
- [ ] All acronyms are explained on first use
- [ ] Version number is updated
- [ ] Related sections are cross-linked
- [ ] Table of contents matches actual sections

---

## 📞 Support & Questions

### What should I do if...

**I find an error in the docs?**
- Update the relevant document
- Fix the link or code example
- Update the last modified date
- Add a note about what changed

**I want to add new documentation?**
- Follow the structure of existing docs
- Add entry to this index
- Link from related sections
- Include code examples

**I'm confused about a concept?**
- Search all three main docs for the topic
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for high-level explanation
- Check [DATA_FLOW_WORKFLOWS.md](DATA_FLOW_WORKFLOWS.md) for detailed flow
- Check [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) for code/CLI

---

## 📈 Documentation Statistics

| Document | Purpose | Size | Read Time |
|---|---|---|---|
| ARCHITECTURE.md | System design | ~150 KB | 30-40 min |
| DEVELOPER_QUICK_REFERENCE.md | Developer handbook | ~100 KB | 20-30 min |
| DATA_FLOW_WORKFLOWS.md | Detailed workflows | ~120 KB | 25-35 min |
| DOCUMENTATION_INDEX.md | Navigation guide | ~20 KB | 5-10 min |

**Total Documentation**: ~390 KB of comprehensive documentation

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: API Flow Tester Team  

**Next Steps**: Choose a document from the overview section based on your needs!
