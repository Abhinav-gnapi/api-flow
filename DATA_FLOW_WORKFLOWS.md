# Data Flow & Complete Workflows Documentation

Visual and detailed breakdowns of how data flows through all major features.

---

## Table of Contents

1. [How to Read This Document](#how-to-read-this-document)
2. [Core Workflow: Single API Test Execution](#core-workflow-single-api-test-execution)
3. [Workflow: Multi-Step Flow Execution](#workflow-multi-step-flow-execution)
4. [Workflow: AI Edge Case Generation](#workflow-ai-edge-case-generation)
5. [Workflow: Report Generation](#workflow-report-generation)
6. [Workflow: Swagger Import](#workflow-swagger-import)
7. [Component Interaction Diagram](#component-interaction-diagram)
8. [Data Transformation Examples](#data-transformation-examples)

---

## How to Read This Document

Each workflow section includes:

1. **High-Level Overview** - The user's perspective
2. **Step-by-Step Process** - What happens at each stage
3. **Data Structure** - How data is shaped/transformed
4. **Code Snippets** - Example implementations
5. **Error Cases** - What can go wrong

---

## Core Workflow: Single API Test Execution

### User Scenario

Charlie creates an API config for a login endpoint, enters a test payload, and clicks "Run Test" to see the response and latency.

### High-Level Flow

```
User writes payload
    ↓
Clicks "Run Test"
    ↓
Frontend sends request to backend
    ↓
Backend makes HTTP call to target API
    ↓
Backend captures response + latency
    ↓
Frontend displays result in 3rd panel
    ↓
User sees: response body, status code, latency (ms)
```

### Step-by-Step Execution

#### Step 1: User Enters Test Data

**Location**: ConfigEditorPage (3-panel editor, left panel)

```jsx
// Frontend state
const [payload, setPayload] = useState({
  email: "test@example.com",
  password: "password123"
});
```

**Input**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Step 2: User Clicks "Run Test"

**Location**: ConfigEditorPage, center panel action button

```jsx
const handleRunTest = async () => {
  try {
    const response = await api.post('/runner/execute', {
      configId: configId,
      payload: payload
    });
    setResponse(response.data);
    setLatency(response.data.latency);
  } catch (err) {
    toast.error('Test failed: ' + err.message);
  }
};
```

**Frontend sends**:
```http
POST http://localhost:5000/api/runner/execute
Content-Type: application/json

{
  "configId": "660aa1b5c1d2f8e3a4b5c6d7",
  "payload": {
    "email": "test@example.com",
    "password": "password123"
  }
}
```

#### Step 3: Backend Receives Request

**Location**: backend/src/routes/runner.routes.js → controller

```javascript
// Route
router.post('/execute', runnerController.executeTest);

// Controller receives
req.body = {
  configId: "660aa1b5c1d2f8e3a4b5c6d7",
  payload: { email: "test@example.com", password: "password123" }
}
```

#### Step 4: Backend Fetches Config from Database

**Location**: runner.controller.js

```javascript
// Query MongoDB
const config = await ApiConfig.findById(configId);
console.log('Fetched config:', config);
```

**Config from DB**:
```javascript
{
  _id: "660aa1b5c1d2f8e3a4b5c6d7",
  name: "User Login",
  method: "POST",
  url: "https://api.example.com/auth/login",
  headers: { "Content-Type": "application/json" },
  queryParams: {},
  createdAt: "2024-01-01T10:00:00Z"
}
```

#### Step 5: Backend Constructs Request

**Location**: runner.controller.js

```javascript
// Build axios request config
const requestConfig = {
  method: config.method,           // "POST"
  url: config.url,                // "https://api.example.com/auth/login"
  headers: config.headers,        // { "Content-Type": "application/json" }
  params: config.queryParams,     // {}
  data: payload,                  // { email: "...", password: "..." }
  timeout: 30000                  // 30 second timeout
};

console.log('Sending request:', requestConfig);
```

#### Step 6: Backend Makes HTTP Request & Measures Latency

**Location**: runner.controller.js

```javascript
// Record start time
const startTime = Date.now();

try {
  // Make actual HTTP request
  const response = await axios(requestConfig);
  
  // Record end time
  const latency = Date.now() - startTime;
  
  console.log('Response status:', response.status);
  console.log('Response data:', response.data);
  console.log('Latency:', latency, 'ms');
  
  return {
    actualResponse: response.data,
    status: response.status,
    headers: response.headers,
    latency: latency,
    passed: true
  };
} catch (error) {
  const latency = Date.now() - startTime;
  
  return {
    actualResponse: error.response?.data || error.message,
    status: error.response?.status || 0,
    error: error.message,
    latency: latency,
    passed: false
  };
}
```

#### Step 7: Backend Returns Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "actualResponse": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 123, "name": "Test User" },
    "expiresIn": 3600
  },
  "status": 200,
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  },
  "latency": 245,
  "passed": true
}
```

#### Step 8: Frontend Receives & Displays Response

**Location**: ConfigEditorPage.jsx

```jsx
setResponse(response.data.actualResponse);
setLatency(response.data.latency);
setStatus(response.data.status);

// Render in right panel
<ResponsePanel 
  response={response}
  latency={latency}
  status={status}
/>
```

**User sees** (right panel):
```
Status: 200
Latency: 245 ms

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "name": "Test User"
  },
  "expiresIn": 3600
}
```

### Error Scenarios

#### Scenario A: Invalid Payload

**User enters**:
```json
{
  "email": "invalid-email",
  "password": "pass"
}
```

**Backend receives request, executes API call**:
- API returns: `HTTP 400 Bad Request`
- Backend captures response
- Latency: 195 ms

**Frontend shows**:
```
Status: 400
Latency: 195 ms
Error: Bad Request

Response:
{
  "error": "Invalid email format"
}
```

#### Scenario B: Network Timeout

**API endpoint is slow/unreachable**:
- Request exceeds 30 second timeout
- Backend catches Error: ECONNABORTED

**Frontend shows**:
```
Status: 0
Error: Request timeout after 30000 ms
Latency: 30000 ms
```

#### Scenario C: Wrong URL

**Config has wrong URL** (e.g., typo):
- Backend makes request to wrong endpoint
- API returns: `HTTP 404 Not Found`

**Frontend shows**:
```
Status: 404
Error: Not Found
```

---

## Workflow: Multi-Step Flow Execution

### User Scenario

Alice designs a 3-step flow:
1. Register user → extract `userId` and `token`
2. Get user profile using `userId` → extract `profileId`
3. Update profile using `profileId` and `token`

She clicks "Execute Flow" and sees all 3 steps complete with their latencies and extracted variables.

### High-Level Flow

```
User saves flow design
    ↓
User clicks "Execute Flow"
    ↓
Backend fetches flow config
    ↓
FOR EACH STEP:
  • Inject variables from previous steps
  • Make HTTP request
  • Extract variables from response
  • Pass to next step
    ↓
Backend returns complete execution log
    ↓
Frontend displays step-by-step results
```

### Step-by-Step Execution

#### Step 0: Flow Definition (Saved in DB)

**Flow document in MongoDB**:
```javascript
{
  _id: "flow_001",
  name: "User Registration Flow",
  description: "Register user and update profile",
  
  globalInjectVariables: {
    "apiKey": "secret-key-123",
    "baseUrl": "https://api.example.com"
  },
  
  steps: [
    {
      id: "step1",
      name: "Register User",
      configId: "config_register",
      method: "POST",
      url: "/auth/register",  // Will be joined with baseUrl
      headers: { "X-API-Key": "{{apiKey}}" },
      body: { "email": "user@example.com", "password": "pass123" },
      extractVariables: {
        "userId": "$.data.userId",
        "token": "$.data.token"
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "step2",
      name: "Get Profile",
      configId: "config_profile",
      method: "GET",
      url: "/users/{{userId}}/profile",  // Uses step1's extracted userId
      headers: { 
        "Authorization": "Bearer {{token}}",  // Uses step1's extracted token
        "X-API-Key": "{{apiKey}}"
      },
      extractVariables: {
        "profileId": "$.data.profile.id",
        "bio": "$.data.profile.bio"
      },
      position: { x: 300, y: 0 }
    },
    {
      id: "step3",
      name: "Update Profile",
      configId: "config_update",
      method: "PUT",
      url: "/profiles/{{profileId}}",  // Uses step2's extracted profileId
      headers: { 
        "Authorization": "Bearer {{token}}",  // Uses step1's token (available globally)
        "X-API-Key": "{{apiKey}}"
      },
      body: { "bio": "Updated bio" },
      position: { x: 600, y: 0 }
    }
  ]
}
```

#### Step 1: Frontend Sends Flow Execution Request

**Frontend**:
```jsx
const handleExecuteFlow = async () => {
  const response = await api.post(`/flows/${flowId}/execute`);
  setExecutionLog(response.data);
};
```

**HTTP Request**:
```http
POST http://localhost:5000/api/flows/flow_001/execute
```

#### Step 2: Backend Fetches Flow & Prepares Variables

**Location**: flow.controller.js

```javascript
const flow = await Flow.findById(flowId);

// Initialize variable context
const variableContext = { ...flow.globalInjectVariables };
// Result: { "apiKey": "secret-key-123", "baseUrl": "https://api.example.com" }

const executionLog = [];
```

#### Step 3: Execute Step 1 (Register User)

**Location**: flow.controller.js

```javascript
const step = flow.steps[0];

// Prepare request
const url = step.url;  // "/auth/register"
const headers = {
  "X-API-Key": "{{apiKey}}"
};

// Inject variables
const injectedHeaders = Object.entries(headers).reduce((acc, [key, value]) => {
  acc[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
    return variableContext[varName] || '';
  });
  return acc;
}, {});

// Result:
// { "X-API-Key": "secret-key-123" }

const startTime = Date.now();
const response = await axios({
  method: "POST",
  url: "https://api.example.com/auth/register",
  headers: injectedHeaders,
  data: step.body
});
const latency = Date.now() - startTime;

// Extract variables from response
const response.data = {
  data: {
    userId: 12345,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
};

// Extract using JSONPath
const jp = require('jsonpath');
Object.entries(step.extractVariables).forEach(([varName, jsonPath]) => {
  const value = jp.query(response.data, jsonPath)[0];
  variableContext[varName] = value;
});

// Result: variableContext now has
// { 
//   "apiKey": "secret-key-123",
//   "baseUrl": "https://api.example.com",
//   "userId": 12345,
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// }

// Add to execution log
executionLog.push({
  stepId: "step1",
  stepName: "Register User",
  status: "success",
  request: {
    method: "POST",
    url: "https://api.example.com/auth/register",
    headers: injectedHeaders,
    body: step.body
  },
  response: response.data,
  latency: latency,  // e.g., 245 ms
  extractedVariables: {
    "userId": 12345,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
});
```

#### Step 4: Execute Step 2 (Get Profile) - With Injected Variables

**Using variables from Step 1**:
```javascript
const step = flow.steps[1];

// URL template: "/users/{{userId}}/profile"
// After injection: "/users/12345/profile"
const injectedUrl = step.url.replace(
  /\{\{([^}]+)\}\}/g, 
  (_, varName) => variableContext[varName]
);

// Headers template:
// { 
//   "Authorization": "Bearer {{token}}",
//   "X-API-Key": "{{apiKey}}"
// }

// After injection:
// {
//   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "X-API-Key": "secret-key-123"
// }

const startTime = Date.now();
const response = await axios({
  method: "GET",
  url: "https://api.example.com/users/12345/profile",
  headers: injectedHeaders
});
const latency = Date.now() - startTime;

// response.data:
// {
//   "data": {
//     "profile": {
//       "id": "profile_999",
//       "bio": "Hello world"
//     }
//   }
// }

// Extract variables
// { "profileId": "profile_999", "bio": "Hello world" }
// Add to variableContext

// Add to execution log
executionLog.push({
  stepId: "step2",
  stepName: "Get Profile",
  status: "success",
  latency: 189,  // ms
  extractedVariables: {
    "profileId": "profile_999",
    "bio": "Hello world"
  }
  // ... more details
});
```

#### Step 5: Execute Step 3 (Update Profile)

**Using variables from previous steps**:
```javascript
const step = flow.steps[2];

// URL: "/profiles/{{profileId}}"
// After injection: "/profiles/profile_999"

const injectedUrl = "/profiles/profile_999";

const injectedHeaders = {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "X-API-Key": "secret-key-123"
};

const startTime = Date.now();
const response = await axios({
  method: "PUT",
  url: "https://api.example.com/profiles/profile_999",
  headers: injectedHeaders,
  data: step.body
});
const latency = Date.now() - startTime;

// Add to execution log
executionLog.push({
  stepId: "step3",
  stepName: "Update Profile",
  status: "success",
  latency: 156,  // ms
  response: response.data
});
```

#### Step 6: Return Complete Execution Log

**Backend returns**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "flowId": "flow_001",
  "flowName": "User Registration Flow",
  "totalSteps": 3,
  "totalLatency": 590,
  "status": "success",
  "steps": [
    {
      "stepId": "step1",
      "stepName": "Register User",
      "status": "success",
      "request": {
        "method": "POST",
        "url": "https://api.example.com/auth/register",
        "headers": { "X-API-Key": "secret-key-123" },
        "body": { "email": "user@example.com", "password": "pass123" }
      },
      "response": {
        "data": {
          "userId": 12345,
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
      },
      "latency": 245,
      "extractedVariables": { "userId": 12345, "token": "..." }
    },
    {
      "stepId": "step2",
      "stepName": "Get Profile",
      "status": "success",
      "latency": 189,
      "extractedVariables": { "profileId": "profile_999", "bio": "Hello world" }
    },
    {
      "stepId": "step3",
      "stepName": "Update Profile",
      "status": "success",
      "latency": 156,
      "response": { "success": true }
    }
  ]
}
```

#### Step 7: Frontend Displays Results

**Frontend renders**:
```jsx
<FlowExecutionResults 
  execution={executionLog}
/>

// Displays:
// Step 1: Register User ✓ (245 ms)
//   Variables extracted: userId = 12345, token = "..."
// 
// Step 2: Get Profile ✓ (189 ms)
//   Variables extracted: profileId = "profile_999"
//
// Step 3: Update Profile ✓ (156 ms)
//
// Total: 590 ms (all steps)
```

### Error Scenario: Step 2 Fails

**If Step 2 fails** (e.g., 401 Unauthorized):

```javascript
// Step 2 execution fails
const response = axios(...)  // Throws error
// HTTP 401: Invalid token

// Flow controller catches error
catch (error) {
  executionLog.push({
    stepId: "step2",
    stepName: "Get Profile",
    status: "failed",
    error: "401 Unauthorized",
    latency: 45,
    response: error.response.data
  });
  
  // Stop execution (don't run Step 3)
  return {
    flowId: flowId,
    status: "failed",
    failedAt: "step2",
    steps: executionLog
  };
}
```

**Frontend shows**:
```
Step 1: Register User ✓ (245 ms)
Step 2: Get Profile ✗ FAILED (45 ms)
  Error: 401 Unauthorized
Step 3: Update Profile — SKIPPED (flow stopped)
```

---

## Workflow: AI Edge Case Generation

### User Scenario

Bob is testing a password field. He clicks "Generate Edge Cases" and the system uses AI to suggest edge cases like:
- Empty string
- SQL injection attempts
- Very long password (10,000 chars)
- Special characters
- Etc.

### High-Level Flow

```
User clicks "Generate Edge Cases"
    ↓
Frontend sends current payload to backend
    ↓
Backend calls Google Gemini API
    ↓
Gemini returns edge case suggestions
    ↓
Backend saves as new Payloads
    ↓
Frontend displays generated payloads
    ↓
User can test each one
```

### Step-by-Step Execution

#### Step 1: User Input

**User selects payload**:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**Clicks "Generate Edge Cases"** button

#### Step 2: Frontend Sends Request

```jsx
const handleGenerateEdgeCases = async () => {
  const response = await api.post('/ai/generate', {
    configId: configId,
    payload: payload
  });
  
  const generatedPayloads = response.data.generated;
  // Display generated payloads
};
```

**HTTP Request**:
```http
POST http://localhost:5000/api/ai/generate
Content-Type: application/json

{
  "configId": "config_login",
  "payload": {
    "email": "test@example.com",
    "password": "SecurePass123!"
  }
}
```

#### Step 3: Backend Receives & Formats Prompt

**Location**: ai.controller.js

```javascript
const { configId, payload } = req.body;

// Get config details
const config = await ApiConfig.findById(configId);

// Build prompt for Gemini
const prompt = `
You are an API testing expert. Given the following API endpoint and test payload, 
generate 5-10 edge case test payloads that would help test boundary conditions, 
security vulnerabilities, and error handling.

API Endpoint: ${config.method} ${config.url}
API Name: ${config.name}

Current Valid Payload:
${JSON.stringify(payload, null, 2)}

Generate edge case payloads focusing on:
1. Empty/null values
2. Type mismatches (string vs number)
3. SQL injection attempts
4. XSS attempts
5. Extremely long values
6. Special characters
7. Invalid formats (emails, dates)
8. Boundary values

Return ONLY a valid JSON array with no additional text:
[
  { "email": "...", "password": "..." },
  { "email": "...", "password": "..." },
  ...
]
`;

console.log('Sending prompt to Gemini:', prompt);
```

#### Step 4: Backend Calls Google Gemini API

**Location**: ai.controller.js

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const startTime = Date.now();

const result = await model.generateContent(prompt);
const responseText = result.response.text();

const callDuration = Date.now() - startTime;
console.log('Gemini call took:', callDuration, 'ms');
console.log('Gemini response:', responseText);

// Response example:
// [
//   { "email": "", "password": "SecurePass123!" },
//   { "email": "test@example.com", "password": "" },
//   { "email": "'; DROP TABLE--", "password": "pass" },
//   { "email": "test@example.com", "password": "a".repeat(10000) },
//   { "email": "test@example.com", "password": "<script>alert('xss')</script>" },
//   { "email": "invalid-email", "password": "pass" },
//   { "email": "test+tag@example.com", "password": "pass" },
//   { "email": "test@example.com", "password": "123456" },
//   { "email": "test@example.com@malicious.com", "password": "pass" }
// ]
```

#### Step 5: Backend Parses & Saves Payloads

**Location**: ai.controller.js

```javascript
// Parse JSON response
let generatedPayloads = [];
try {
  generatedPayloads = JSON.parse(responseText);
} catch (e) {
  // Gemini might include markdown, extract JSON
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  generatedPayloads = JSON.parse(jsonMatch[0]);
}

console.log('Parsed payloads:', generatedPayloads.length);

// Save each as new Payload document
const savedPayloads = [];

for (const payload of generatedPayloads) {
  const newPayload = await Payload.create({
    configId: configId,
    body: payload,
    description: `Generated by AI: edge case test`,
    isGenerated: true
  });
  
  savedPayloads.push({
    _id: newPayload._id,
    body: newPayload.body,
    description: newPayload.description
  });
}

console.log('Saved', savedPayloads.length, 'payloads');
```

#### Step 6: Backend Returns Generated Payloads

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "generated": 9,
  "payloads": [
    {
      "_id": "payload_ai_001",
      "body": { "email": "", "password": "SecurePass123!" },
      "description": "Generated by AI: edge case test",
      "isGenerated": true
    },
    {
      "_id": "payload_ai_002",
      "body": { "email": "test@example.com", "password": "" },
      "description": "Generated by AI: edge case test",
      "isGenerated": true
    },
    ... more payloads
  ],
  "prompt_used": "...",
  "ai_call_duration_ms": 1250
}
```

#### Step 7: Frontend Displays & User Tests

**Frontend shows**:
```
Generated Edge Cases (9 new payloads)

[1] { email: "", password: "SecurePass123!" }
    [Test] [Delete]

[2] { email: "test@example.com", password: "" }
    [Test] [Delete]

[3] { email: "'; DROP TABLE--", password: "pass" }
    [Test] [Delete]

... etc
```

**User can**:
- Click "Test" to run the payload immediately
- Delete if not relevant
- Save for future use

---

## Workflow: Report Generation

### User Scenario

Diana selects 5 test payloads and clicks "Run All" to generate a comprehensive report with pass/fail results, latencies, and statistics.

### Step-by-Step Execution

#### Step 1: User Selects Payloads

**ConfigEditorPage**:
```jsx
const [selectedPayloads, setSelectedPayloads] = useState([
  "payload_001",
  "payload_002",
  "payload_003",
  "payload_ai_001",
  "payload_ai_002"
]);
```

**User clicks "Run All" button**

#### Step 2: Frontend Sends Request

```jsx
const handleRunAll = async () => {
  const response = await api.post('/reports/generate', {
    configId: configId,
    payloadIds: selectedPayloads
  });
  
  // Navigate to report page
  navigate(`/report/${response.data._id}`);
};
```

**HTTP Request**:
```http
POST http://localhost:5000/api/reports/generate
Content-Type: application/json

{
  "configId": "config_login",
  "payloadIds": [
    "payload_001",
    "payload_002",
    "payload_003",
    "payload_ai_001",
    "payload_ai_002"
  ]
}
```

#### Step 3: Backend Fetches Config & Payloads

**Location**: report.controller.js

```javascript
const config = await ApiConfig.findById(configId);
const payloads = await Payload.find({ _id: { $in: payloadIds } });

console.log('Running', payloads.length, 'tests for config:', config.name);
```

#### Step 4: Backend Runs Each Test Sequentially

**Location**: report.controller.js

```javascript
const results = [];

for (const payload of payloads) {
  console.log(`\nRunning test: ${payload._id}`);
  
  // Call runner controller
  const result = await runnerController.executeTest(config, payload.body);
  
  // Determine pass/fail
  const passed = result.passed;
  
  results.push({
    payloadId: payload._id,
    passed: passed,
    actualResponse: result.actualResponse,
    status: result.status,
    latency: result.latency,
    error: result.error || null,
    testedAt: new Date()
  });
  
  console.log(`Result: ${passed ? '✓ PASS' : '✗ FAIL'} (${result.latency}ms)`);
}

console.log('All tests completed');
```

**Example execution output**:
```
Running test: payload_001
Result: ✓ PASS (245 ms)

Running test: payload_002
Result: ✓ PASS (198 ms)

Running test: payload_003
Result: ✗ FAIL (45 ms)
  Error: 400 Bad Request

Running test: payload_ai_001
Result: ✗ FAIL (52 ms)
  Error: 400 Bad Request

Running test: payload_ai_002
Result: ✓ PASS (201 ms)

All tests completed
```

#### Step 5: Backend Aggregates Statistics

**Location**: report.controller.js

```javascript
const totalLatencies = results
  .filter(r => r.passed)
  .map(r => r.latency);

const avgLatency = totalLatencies.length > 0
  ? totalLatencies.reduce((a, b) => a + b, 0) / totalLatencies.length
  : 0;

const summary = {
  totalTests: results.length,
  passed: results.filter(r => r.passed).length,
  failed: results.filter(r => !r.passed).length,
  passRate: (results.filter(r => r.passed).length / results.length * 100).toFixed(2),
  avgLatency: avgLatency.toFixed(2),
  minLatency: Math.min(...totalLatencies),
  maxLatency: Math.max(...totalLatencies)
};

console.log('Summary:', summary);
// Summary: {
//   totalTests: 5,
//   passed: 3,
//   failed: 2,
//   passRate: 60,
//   avgLatency: 214.67,
//   minLatency: 198,
//   maxLatency: 245
// }
```

#### Step 6: Backend Saves Report to Database

**Location**: report.controller.js

```javascript
const report = await Report.create({
  configId: configId,
  payloads: results,
  summary: summary,
  executedAt: new Date(),
  userId: req.user?.id || null,  // Optional: track user
  environment: process.env.NODE_ENV
});

console.log('Report saved:', report._id);
```

**Report document in MongoDB**:
```javascript
{
  _id: "report_20240115_001",
  configId: "config_login",
  payloads: [
    {
      payloadId: "payload_001",
      passed: true,
      actualResponse: { token: "...", user: { id: 1, name: "Test" } },
      status: 200,
      latency: 245,
      error: null,
      testedAt: "2024-01-15T10:30:01Z"
    },
    {
      payloadId: "payload_002",
      passed: true,
      actualResponse: { ... },
      status: 200,
      latency: 198,
      error: null,
      testedAt: "2024-01-15T10:30:02Z"
    },
    {
      payloadId: "payload_003",
      passed: false,
      actualResponse: { error: "Invalid fields" },
      status: 400,
      latency: 45,
      error: "400 Bad Request",
      testedAt: "2024-01-15T10:30:03Z"
    },
    ...
  ],
  summary: {
    totalTests: 5,
    passed: 3,
    failed: 2,
    passRate: "60.00",
    avgLatency: "214.67",
    minLatency: 198,
    maxLatency: 245
  },
  executedAt: "2024-01-15T10:30:05Z",
  createdAt: "2024-01-15T10:30:05Z"
}
```

#### Step 7: Backend Returns Report

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "_id": "report_20240115_001",
  "configId": "config_login",
  "configName": "User Login",
  "payloads": [ ... same as DB ... ],
  "summary": {
    "totalTests": 5,
    "passed": 3,
    "failed": 2,
    "passRate": "60.00",
    "avgLatency": "214.67",
    "minLatency": 198,
    "maxLatency": 245
  },
  "executedAt": "2024-01-15T10:30:05Z",
  "duration": "4.5 seconds"
}
```

#### Step 8: Frontend Displays Report

**ReportPage renders**:
```
User Login - Test Report
Executed: Jan 15, 2024 10:30 AM

Summary:
├─ Total Tests: 5
├─ Passed: 3 ✓
├─ Failed: 2 ✗
├─ Pass Rate: 60%
└─ Avg Latency: 214.67 ms

Test Results:
┌─────────────────────────────────────────────┐
│ Test | Status | Latency | Error             │
├─────────────────────────────────────────────┤
│ 1    | ✓ PASS | 245 ms  | -                 │
│ 2    | ✓ PASS | 198 ms  | -                 │
│ 3    | ✗ FAIL | 45 ms   | 400 Bad Request   │
│ 4    | ✗ FAIL | 52 ms   | 400 Bad Request   │
│ 5    | ✓ PASS | 201 ms  | -                 │
└─────────────────────────────────────────────┘

Performance Chart:
├─ Min Latency: 45 ms
├─ Max Latency: 245 ms
└─ Avg Latency: 214.67 ms

Actions:
[Create GitHub Issue] [Create Jira Issue] [Re-run]
```

---

## Workflow: Swagger Import

### User Scenario

Eve uploads a Swagger/OpenAPI specification JSON file. The system automatically creates API configs for all endpoints in the spec.

### High-Level Flow

```
User uploads Swagger JSON
    ↓
Backend parses spec
    ↓
FOR EACH endpoint in spec:
  • Extract method, path, parameters
  • Create ApiConfig
  • Create sample Payload
    ↓
Save all to database
    ↓
Frontend shows "Created X configs"
```

### Step-by-Step Execution

#### Step 1: User Uploads Swagger File

**SwaggerPage**:
```jsx
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/swagger/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  setCreatedConfigs(response.data.configs);
};
```

**User selects**:
```
openapi: 3.0.0
info:
  title: "Pet Store API"
  version: "1.0.0"

paths:
  /pets:
    get:
      summary: "List all pets"
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: "Successful response"
    post:
      summary: "Create pet"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                age:
                  type: integer
      responses:
        '201':
          description: "Pet created"

  /pets/{petId}:
    get:
      summary: "Get pet by ID"
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
```

#### Step 2: Backend Receives & Validates File

**Location**: swagger.controller.js

```javascript
const multer = require('multer');

// Check file exists
if (!req.file) {
  return res.status(400).json({ error: 'No file uploaded' });
}

const fileBuffer = req.file.buffer;
const fileName = req.file.originalname;

console.log(`Processing Swagger file: ${fileName} (${fileBuffer.length} bytes)`);

// Check if YAML or JSON
const isYaml = fileName.endsWith('.yaml') || fileName.endsWith('.yml');
const isJson = fileName.endsWith('.json');

if (!isYaml && !isJson) {
  return res.status(400).json({ error: 'File must be .json or .yaml' });
}
```

#### Step 3: Backend Parses Swagger Spec

**Location**: swagger.controller.js

```javascript
const SwaggerParser = require('swagger-parser');

let api;
try {
  // Parse and validate spec
  api = await SwaggerParser.validate(fileBuffer);
  console.log(`Spec parsed: ${api.info.title} v${api.info.version}`);
} catch (error) {
  return res.status(400).json({ 
    error: 'Invalid Swagger/OpenAPI spec: ' + error.message 
  });
}

// Extract base URL
const baseUrl = 
  api.servers?.[0]?.url || 
  api.host || 
  'https://api.example.com';

console.log('Base URL:', baseUrl);
```

#### Step 4: Backend Creates Configs for Each Endpoint

**Location**: swagger.controller.js

```javascript
const createdConfigs = [];

// Iterate paths
Object.entries(api.paths).forEach(([path, pathItem]) => {
  
  // Iterate HTTP methods
  Object.entries(pathItem).forEach(([method, operation]) => {
    
    if (!operation.summary) return;  // Skip non-operation entries
    
    // Build full URL
    let url = `${baseUrl}${path}`;
    
    // Extract parameters
    const queryParams = {};
    const pathParams = {};
    
    (operation.parameters || []).forEach(param => {
      if (param.in === 'query') {
        queryParams[param.name] = param.schema?.example || '';
      } else if (param.in === 'path') {
        pathParams[param.name] = param.schema?.example || 'value';
        // Replace in URL: /pets/{petId} becomes /pets/value
        url = url.replace(`{${param.name}}`, pathParams[param.name]);
      }
    });
    
    // Extract request body schema
    let bodyExample = {};
    const requestBody = operation.requestBody;
    if (requestBody?.content?.['application/json']) {
      const schema = requestBody.content['application/json'].schema;
      // Generate example from schema
      bodyExample = generateSchemaExample(schema);
    }
    
    // Create ApiConfig
    const config = {
      name: operation.summary,
      method: method.toUpperCase(),
      url: url,
      headers: { 'Content-Type': 'application/json' },
      queryParams: queryParams
    };
    
    console.log(`Creating config: ${config.method} ${config.url}`);
    createdConfigs.push(config);
  });
});

console.log(`Total configs to create: ${createdConfigs.length}`);
```

**Results**:
```
Creating config: GET https://api.example.com/pets
Creating config: POST https://api.example.com/pets
Creating config: GET https://api.example.com/pets/value

Total configs to create: 3
```

#### Step 5: Backend Saves to Database

**Location**: swagger.controller.js

```javascript
const configIds = [];

for (const configData of createdConfigs) {
  // Save config
  const config = await ApiConfig.create(configData);
  configIds.push(config._id);
  
  console.log(`Saved config: ${config._id} - ${config.name}`);
  
  // Create sample payload
  const payload = await Payload.create({
    configId: config._id,
    body: configData.bodyExample || {},
    description: `Sample payload for ${config.name}`,
    isGenerated: false
  });
  
  console.log(`Created sample payload: ${payload._id}`);
}

console.log(`Import complete: created ${configIds.length} configs`);
```

**Database result**:
```
ApiConfig 1: GET /pets (query: limit)
  Payload 1: { }

ApiConfig 2: POST /pets
  Payload 2: { name: "Fluffy", age: 5 }

ApiConfig 3: GET /pets/{petId}
  Payload 3: { }
```

#### Step 6: Backend Returns Summary

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "title": "Pet Store API",
  "version": "1.0.0",
  "baseUrl": "https://api.example.com",
  "created": 3,
  "configs": [
    {
      "_id": "config_001",
      "name": "List all pets",
      "method": "GET",
      "url": "https://api.example.com/pets",
      "queryParams": { "limit": "" }
    },
    {
      "_id": "config_002",
      "name": "Create pet",
      "method": "POST",
      "url": "https://api.example.com/pets",
      "bodyExample": { "name": "Fluffy", "age": 5 }
    },
    {
      "_id": "config_003",
      "name": "Get pet by ID",
      "method": "GET",
      "url": "https://api.example.com/pets/value",
      "pathParams": { "petId": "value" }
    }
  ]
}
```

#### Step 7: Frontend Displays Results

**SwaggerPage shows**:
```
✓ Import Successful

Pet Store API v1.0.0
Created 3 API Configs

Configs:
1. [GET] /pets - List all pets
   [View] [Test]

2. [POST] /pets - Create pet
   [View] [Test]

3. [GET] /pets/{petId} - Get pet by ID
   [View] [Test]

All configs are ready to test!
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ DashboardPage   │  │ ConfigEditorPage │  │ FlowDesignerPage │ │
│  │                 │  │ (3-panel UI)     │  │ (ReactFlow)      │ │
│  │ • List configs  │  │                  │  │                  │ │
│  │ • Create config │  │ • Edit payload   │  │ • Drag endpoints │ │
│  │ • Delete config │  │ • Run test       │  │ • Set variables  │ │
│  │ • Open editor   │  │ • View response  │  │ • Execute flow   │ │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘ │
│          ↓                    ↓                      ↓              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              services/api.js (Axios)                        │ │
│  │ • HTTP requests to backend                                  │ │
│  │ • Error handling & toast notifications                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                          ↓ HTTP ↑
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Routes                                │   │
│  │  /api/configs | /api/payloads | /api/runner             │   │
│  │  /api/reports | /api/ai | /api/flows | /api/swagger     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Controllers                            │   │
│  │ • Validate input                                         │   │
│  │ • Business logic                                         │   │
│  │ • Call models for DB operations                          │   │
│  │ • Call external APIs (Gemini, GitHub, Jira)             │   │
│  │ • Format response                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Data Models                             │   │
│  │ • ApiConfig.model.js                                     │   │
│  │ • Payload.model.js                                       │   │
│  │ • Report.model.js                                        │   │
│  │ • Flow.model.js                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              External Dependencies                       │   │
│  │  • Axios (HTTP calls to user's APIs)                     │   │
│  │  • Google Generative AI (Gemini)                         │   │
│  │  • Mongoose (MongoDB)                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
        ↓ database                ↓ API calls
┌──────────────────┐      ┌──────────────────────┐
│    MongoDB       │      │   External APIs      │
│                  │      │                      │
│ • api_configs    │      │ • Target endpoints   │
│ • payloads       │      │ • Google Gemini      │
│ • reports        │      │ • GitHub REST API    │
│ • flows          │      │ • Jira REST API      │
└──────────────────┘      └──────────────────────┘
```

---

## Data Transformation Examples

### Example 1: Config to Request

```javascript
// Database (ApiConfig)
{
  _id: "config_login",
  name: "User Login",
  method: "POST",
  url: "https://api.example.com/auth/login",
  headers: {
    "Content-Type": "application/json",
    "X-API-Version": "v2"
  },
  queryParams: {
    "redirect": "https://example.com/dashboard"
  }
}

// User Payload
{
  email: "user@example.com",
  password: "password123"
}

// Transformed to HTTP Request
{
  method: "POST",
  url: "https://api.example.com/auth/login?redirect=https://example.com/dashboard",
  headers: {
    "Content-Type": "application/json",
    "X-API-Version": "v2"
  },
  data: {
    email: "user@example.com",
    password: "password123"
  }
}

// After Execution
{
  status: 200,
  latency: 245,
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: 123,
      name: "Test User"
    }
  }
}
```

### Example 2: Template Variables to Injected Values

```javascript
// Step 1 response
{
  data: {
    userId: 12345,
    tokens: {
      access: "auth_token_xyz",
      refresh: "refresh_token_abc"
    }
  }
}

// Step 1 extracts
extractVariables: {
  "userId": "$.data.userId",
  "accessToken": "$.data.tokens.access"
}

// Result: Variable context
{
  "apiKey": "secret_key_123",  // from global
  "userId": 12345,              // from step 1
  "accessToken": "auth_token_xyz" // from step 1
}

// Step 2 template
{
  url: "/users/{{userId}}/profile",
  headers: {
    "Authorization": "Bearer {{accessToken}}",
    "X-API-Key": "{{apiKey}}"
  }
}

// Step 2 after injection
{
  url: "/users/12345/profile",
  headers: {
    "Authorization": "Bearer auth_token_xyz",
    "X-API-Key": "secret_key_123"
  }
}
```

### Example 3: Swagger Spec to Config

```javascript
// Swagger Endpoint Definition
{
  path: "/users/{userId}",
  method: "get",
  summary: "Get User by ID",
  parameters: [
    {
      name: "userId",
      in: "path",
      required: true,
      schema: { type: "integer" }
    },
    {
      name: "includeProfile",
      in: "query",
      schema: { type: "boolean" }
    }
  ]
}

// Transformed to ApiConfig
{
  name: "Get User by ID",
  method: "GET",
  url: "https://api.example.com/users/123",
  headers: { "Content-Type": "application/json" },
  queryParams: {
    "includeProfile": ""
  }
}

// Sample Payload
{
  body: {}  // No request body for GET
}
```

---

**Document Version**: 1.0
**Last Updated**: 2024
