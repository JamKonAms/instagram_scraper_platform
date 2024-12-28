# Instagram Scraper Platform - Full Codebase


## File: project-setup.sh
```bash
#!/bin/bash

mkdir instagram-scraper
cd instagram-scraper
mkdir backend frontend docs 
mkdir -p backend/src/{api,scrapers,storage,jobs,utils}

# Initialize backend
cd backend
npm init -y  # Create initial package.json
npm install express dotenv @google-cloud/bigquery axios node-cron winston cors
npm install --save-dev jest nodemon

# Return to project root
cd .. 

# Update any references to bigquery.js
sed -i '' 's/bigquery/bigQueryClient/g' backend/src/**/*.js

# Remove old file
rm -f backend/src/storage/bigquery.js

# Verify BigQuery connection
node -e "
const bigQueryClient = require('./backend/src/storage/bigQueryClient');
bigQueryClient.verifyTableSchema('profiles')
  .then(valid => console.log('Schema verification:', valid ? 'OK' : 'Failed'))
  .catch(console.error)
" 
```

## File: .gitignore
```bash
# Dependencies
node_modules/
/.pnp
.pnp.js

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log

# Build
/build
/dist

# Testing
/coverage

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store 
```

## File: backend/.gitignore
```bash
# Environment variables
.env
!.env.example

# Credentials
credentials/
*.json

# Node
node_modules/

# Test files
request.json 
```

## File: backend/.env
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# RapidAPI Configuration
RAPIDAPI_KEY=e4291c69d8msh2901595909d38dbp107a95jsnb2e6fcaa617f
RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=godspeed-416117
GOOGLE_APPLICATION_CREDENTIALS=/Users/jamiekonincks/Documents/coding/godspeed/instagram_scraper_platform/backend/google_service_account.json
BQ_DATASET=instagram_data

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Endpoints

# Profile Info
GET https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url={username}

# Followers
GET https://instagram-scraper-api2.p.rapidapi.com/v1/followers?username_or_id_or_url={username}

# Following
GET https://instagram-scraper-api2.p.rapidapi.com/v1/following?username_or_id_or_url={username}

# Posts & Reels
GET https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts?username_or_id_or_url={username}
```

## File: backend/scripts/recreateTables.js
```javascript
const bigQueryClient = require('../src/storage/bigQueryClient');
const logger = require('../src/utils/logger');

async function recreateTables() {
  try {
    await bigQueryClient.recreateTable('profiles');
    logger.info('Successfully recreated tables');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to recreate tables:', error);
    process.exit(1);
  }
}

recreateTables(); 
```

## File: backend/src/index.js
```javascript
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const scrapeOrchestrator = require('./jobs/scrapeOrchestrator');
const bigQueryClient = require('./storage/bigQueryClient');

// Early validation of required env vars
const requiredEnvVars = ['RAPIDAPI_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

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

// Error handling middleware (after routes)
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

// Initialize tables and start server
scrapeOrchestrator.initialize()
  .then(() => {
    startServer(config.port);
  })
  .catch(error => {
    logger.error('Failed to initialize tables:', error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});
```

## File: backend/src/config.js
```javascript
require('dotenv').config();

// Required environment variables
const requiredEnvVars = [
  'RAPIDAPI_KEY',
  'RAPIDAPI_HOST',
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

// Validate required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

module.exports = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // RapidAPI configuration
  rapidApi: {
    key: process.env.RAPIDAPI_KEY,
    host: process.env.RAPID_API_HOST,
    endpoints: {
      profile: '/v1/info',
      followers: '/v1/followers',
      following: '/v1/following',
      posts: '/v1.2/posts'
    }
  },

  // Google Cloud configuration
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    bigquery: {
      dataset: process.env.BQ_DATASET || 'instagram_data',
      tables: {
        profiles: 'profiles',
        posts: 'posts',
        stories: 'stories'
      }
    }
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
}; 
```

## File: backend/src/config/index.js
```javascript
const api = require('./api');
const storage = require('./storage');
const schemas = require('./schemas');

module.exports = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API configuration
  api,

  // Storage configuration
  storage,

  // Schema definitions
  schemas,

  // CORS configuration
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
}; 
```

## File: backend/src/config/schemas.js
```javascript
// BigQuery table schemas
module.exports = {
  profiles: [
    { name: 'username', type: 'STRING', mode: 'REQUIRED' },
    { name: 'scrapedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'userId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'fullName', type: 'STRING' },
    { name: 'biography', type: 'STRING' },
    { name: 'externalUrl', type: 'STRING' },
    { name: 'followerCount', type: 'INTEGER' },
    { name: 'followingCount', type: 'INTEGER' },
    { name: 'isPrivate', type: 'BOOLEAN' },
    { name: 'isVerified', type: 'BOOLEAN' },
    { name: 'profilePicUrl', type: 'STRING' },
    { name: 'mediaCount', type: 'INTEGER' },
    { name: 'totalIgtvVideos', type: 'INTEGER' },
    { name: 'isBusinessAccount', type: 'BOOLEAN' },
    { name: 'category', type: 'STRING' },
    { name: 'publicEmail', type: 'STRING' },
    { 
      name: 'bioLinks', 
      type: 'RECORD', 
      mode: 'REPEATED',
      fields: [
        { name: 'title', type: 'STRING' },
        { name: 'url', type: 'STRING' },
        { name: 'linkType', type: 'STRING' }
      ]
    },
    { name: 'biographyWithEntities', type: 'STRING' },
    { name: 'profilePicUrlHd', type: 'STRING' }
  ]
}; 
```

## File: backend/src/tests/testFlow.js
```javascript
const profileScraper = require('../scrapers/profileScraper');
const dataHandler = require('../storage/dataHandler');
const bigQueryClient = require('../storage/bigQueryClient');
const stringUtils = require('../utils/stringUtils');

async function runTests() {
  try {
    // 1. Test API Scrape
    console.log('1. Testing API Scrape...');
    const rawData = await profileScraper.scrapeProfile('wietskeoverdijk');
    console.log('API Response:', rawData);

    // 2. Test Data Transform
    console.log('\n2. Testing Data Transform...');
    console.log('DataHandler methods:', Object.keys(dataHandler));
    const transformedData = dataHandler.transformProfileData(rawData);
    console.log('Transformed Data:', transformedData);

    // 3. Test BigQuery Connection
    console.log('\n3. Testing BigQuery Connection...');
    // For tests, we want to ensure a clean state
    console.log('Ensuring clean test environment...');
    await bigQueryClient.recreateTable('profiles');

    // 4. Test Data Insertion
    console.log('\n4. Testing Data Insertion...');
    await bigQueryClient.insertData('profiles', [transformedData]);
    console.log('Data inserted successfully!');

    // 5. Test String Utils
    console.log('\nTesting String Utils...');
    const testObj = {
      text: "Hello 👋 World ✨",
      nested: { emoji: "🌟" },
      invalid: "Test \uFFFD char"
    };
    console.log('Safe string conversion:', stringUtils.safeString(JSON.stringify(testObj)));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests(); 
```

## File: backend/src/utils/stringUtils.js
```javascript
/**
 * Safely converts values to strings, handling emojis and special characters
 */
function safeString(str) {
  if (!str) return str;
  
  // Handle JSON strings
  if (typeof str === 'string' && (str.startsWith('{') || str.startsWith('['))) {
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed);
    } catch (e) {
      return str;
    }
  }
  
  return str;
}

module.exports = {
  safeString
}; 
```

## File: backend/src/utils/logger.js
```javascript
const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    win