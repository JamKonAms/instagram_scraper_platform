const api = require('./api');
const storage = require('./storage');
const schemas = require('./schemas');

module.exports = {
  api,
  storage,
  schemas,
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  // CORS configuration
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
}; 