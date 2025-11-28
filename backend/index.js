const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import handlers
const uploadHandler = require('./handlers/upload');
const downloadHandler = require('./handlers/download');
const listHandler = require('./handlers/list');
const deleteHandler = require('./handlers/delete');
const shareHandler = require('./handlers/share');

// Middleware to simulate API Gateway event structure
const createLambdaEvent = (req) => {
  return {
    body: JSON.stringify(req.body),
    pathParameters: req.params,
    queryStringParameters: req.query,
    headers: req.headers,
    requestContext: {
      authorizer: {
        principalId: req.headers['x-user-id'] || 'demo-user'
      }
    }
  };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'cloudkeep-backend', timestamp: new Date().toISOString() });
});

// API Routes
app.post('/upload', async (req, res) => {
  try {
    const event = createLambdaEvent(req);
    const result = await uploadHandler.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/download/:fileId', async (req, res) => {
  try {
    const event = createLambdaEvent(req);
    const result = await downloadHandler.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/files', async (req, res) => {
  try {
    const event = createLambdaEvent(req);
    const result = await listHandler.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/files/:fileId', async (req, res) => {
  try {
    const event = createLambdaEvent(req);
    const result = await deleteHandler.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/share/:fileId', async (req, res) => {
  try {
    const event = createLambdaEvent(req);
    const result = await shareHandler.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CloudKeep API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /upload',
      download: 'GET /download/:fileId',
      list: 'GET /files',
      delete: 'DELETE /files/:fileId',
      share: 'POST /share/:fileId'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`CloudKeep Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
