require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const apiConfigRoutes = require('./routes/apiConfig.routes');
const payloadRoutes = require('./routes/payload.routes');
const runnerRoutes = require('./routes/runner.routes');
const reportRoutes = require('./routes/report.routes');
const aiRoutes = require('./routes/ai.routes');
const swaggerRoutes = require('./routes/swagger.routes');
const postmanRoutes = require('./routes/postman.routes');
const flowRoutes = require('./routes/flow.routes');
const bugRoutes  = require('./routes/bug.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/server requests without Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/configs', apiConfigRoutes);
app.use('/api/payloads', payloadRoutes);
app.use('/api/runner', runnerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/swagger', swaggerRoutes);
app.use('/api/postman', postmanRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/bugs',  bugRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
