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
    host: process.env.RAPIDAPI_HOST,
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