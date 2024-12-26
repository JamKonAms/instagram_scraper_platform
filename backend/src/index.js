const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const scrapeOrchestrator = require('./jobs/scrapeOrchestrator');
const bigQueryClient = require('./storage/bigQueryClient');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

function startServer(port) {
  try {
    app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Initialize tables on startup
scrapeOrchestrator.initialize()
  .then(() => {
    startServer(config.port);
  })
  .catch(error => {
    logger.error('Failed to initialize tables:', error);
    process.exit(1);
  });

// Add scraping endpoints
app.post('/api/scrape/profile', async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    logger.info(`Received profile scrape request for username: ${username}`);
    const data = await scrapeOrchestrator.scrapeAndStoreProfile(username);
    res.json({ success: true, data });
    
  } catch (error) {
    logger.error('Profile scrape request failed:', error);
    next(error);
  }
});

app.post('/api/scrape/posts', async (req, res, next) => {
  try {
    const { username, limit } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const data = await scrapeOrchestrator.scrapeAndStorePosts(username, limit);
    res.json({ success: true, data });
    
  } catch (error) {
    next(error);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

// Early validation of required env vars
const requiredEnvVars = ['RAPIDAPI_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});