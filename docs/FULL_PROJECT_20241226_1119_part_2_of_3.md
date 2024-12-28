ston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

module.exports = logger; 
```

## File: backend/src/utils/errors.js
```javascript
// Add custom error classes
class InstagramScraperError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'InstagramScraperError';
    this.code = code;
    this.originalError = originalError;
  }
}

class BigQueryError extends Error {
  constructor(message, operation, originalError = null) {
    super(message);
    this.name = 'BigQueryError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

// Add more specific error types
class APIRateLimitError extends InstagramScraperError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  InstagramScraperError,
  BigQueryError,
  APIRateLimitError
}; 
```

## File: backend/src/storage/bigQueryClient.js
```javascript
const { BigQuery } = require('@google-cloud/bigquery');
const logger = require('../utils/logger');
const config = require('../config');
const schemas = require('../config/schemas');

class BigQueryClient {
  constructor() {
    this.schemas = schemas;

    this.bigquery = new BigQuery({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.credentials,
      location: 'EU'
    });
    this.dataset = config.googleCloud.bigquery.dataset;
  }

  async insertData(tableName, rows) {
    try {
      logger.info(`Inserting ${rows.length} rows into ${tableName}`);
      
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);

      const [response] = await table.insert(rows, {
        schema: this.schemas[tableName],
        skipInvalidRows: false
      });

      if (response?.insertErrors) {
        logger.error('Insert errors:', JSON.stringify(response.insertErrors, null, 2));
        throw new Error('Insert failed with errors');
      }

      logger.info(`Successfully inserted ${rows.length} rows into ${tableName}`);
      return response;
    } catch (error) {
      logger.error(`Error inserting data into ${tableName}:`, error);
      throw error;
    }
  }

  async recreateTable(tableName) {
    try {
      logger.info(`Recreating table ${tableName}`);
      
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);
      
      const [exists] = await table.exists();
      if (exists) {
        await table.delete();
      }
      
      await dataset.createTable(tableName, {
        schema: this.schemas[tableName],
        timePartitioning: {
          type: 'DAY',
          field: 'scrapedAt'
        }
      });
      
      logger.info(`Successfully recreated table ${tableName}`);
    } catch (error) {
      logger.error(`Error recreating table ${tableName}:`, error);
      throw error;
    }
  }

  async createTableIfNotExists(tableName) {
    try {
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);
      
      const [exists] = await table.exists();
      if (!exists) {
        logger.info(`Creating table ${tableName}`);
        await dataset.createTable(tableName, {
          schema: this.schemas[tableName],
          timePartitioning: {
            type: 'DAY',
            field: 'scrapedAt'
          }
        });
        logger.info(`Successfully created table ${tableName}`);
      } else {
        logger.info(`Table ${tableName} already exists`);
      }
    } catch (error) {
      logger.error(`Error creating table ${tableName}:`, error);
      throw error;
    }
  }
}

module.exports = new BigQueryClient(); 
```

## File: backend/src/storage/dataHandler.js
```javascript
const logger = require('../utils/logger');
const { safeString } = require('../utils/stringUtils');

class DataHandler {
  transformProfileData(rawData) {
    try {
      const data = rawData.data;
      
      return {
        // Required fields
        username: String(data.username),
        scrapedAt: new Date().toISOString(),
        userId: String(data.id),

        // Optional fields with type conversion
        fullName: safeString(data.full_name),
        biography: safeString(data.biography)?.substring(0, 1000),
        externalUrl: safeString(data.external_url),
        followerCount: parseInt(data.follower_count) || 0,
        followingCount: parseInt(data.following_count) || 0,
        isPrivate: Boolean(data.is_private),
        isVerified: Boolean(data.is_verified),
        profilePicUrl: safeString(data.profile_pic_url),
        mediaCount: parseInt(data.media_count) || 0,
        totalIgtvVideos: parseInt(data.total_igtv_videos) || 0,
        isBusinessAccount: Boolean(data.is_business),
        category: safeString(data.category),
        publicEmail: safeString(data.public_email),
        
        // Complex fields
        bioLinks: transformBioLinks(data.bio_links),
        biographyWithEntities: data.biography_with_entities ? 
          JSON.stringify(data.biography_with_entities) : null,
        profilePicUrlHd: safeString(data.profile_pic_url_hd)
      };
    } catch (error) {
      logger.error('Error transforming profile data:', error);
      throw error;
    }
  }
}

function transformBioLinks(links) {
  if (!links) return null;
  
  try {
    return links.map(link => ({
      title: String(link.title || ''),
      url: String(link.url?.split('?')[0] || ''), // Remove query params
      linkType: String(link.link_type || '')
    }));
  } catch (error) {
    logger.error('Error transforming bio links:', error);
    return null;
  }
}

module.exports = new DataHandler(); 
```

## File: backend/src/api/rapidapi.js
```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class RapidAPI {
  constructor(config) {
    this.client = axios.create({
      baseURL: 'https://instagram-scraper-api2.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host
      }
    });
  }
}

module.exports = new RapidAPI(); 
```

## File: backend/src/scrapers/profileScraper.js
```javascript
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class ProfileScraper {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://instagram-scraper-api2.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host
      }
    });
  }

  async scrapeProfile(username) {
    try {
      logger.info(`Starting profile scrape for username: ${username}`);
      
      // Log request details
      logger.debug('Request details:', {
        url: `${this.client.defaults.baseURL}${config.rapidApi.endpoints.profile}`,
        headers: this.client.defaults.headers,
        params: { username_or_id_or_url: username }
      });
      
      const response = await this.client.get(config.rapidApi.endpoints.profile, {
        params: { 
          username_or_id_or_url: username 
        }
      });

      // Log complete response
      logger.debug('Complete API Response:', {
        status: response.status,
        headers: response.headers,
        data: JSON.stringify(response.data, null, 2)
      });

      if (!response.data) {
        throw new Error('No data received from API');
      }

      return response.data;
      
    } catch (error) {
      logger.error('Error scraping profile:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  async scrapeFollowers(username) {
    try {
      logger.info(`Starting followers scrape for username: ${username}`);
      
      const response = await this.client.get(config.rapidApi.endpoints.followers, {
        params: { 
          username_or_id_or_url: username 
        }
      });

      return {
        username,
        scrapedAt: new Date().toISOString(),
        followers: response.data
      };
      
    } catch (error) {
      logger.error(`Error scraping followers for ${username}:`, error);
      throw error;
    }
  }

  async scrapeFollowing(username) {
    try {
      logger.info(`Starting following scrape for username: ${username}`);
      
      const response = await this.client.get(config.rapidApi.endpoints.following, {
        params: { 
          username_or_id_or_url: username 
        }
      });

      return {
        username,
        scrapedAt: new Date().toISOString(),
        following: response.data
      };
      
    } catch (error) {
      logger.error(`Error scraping following for ${username}:`, error);
      throw error;
    }
  }
}

// Export for testing
module.exports = new ProfileScraper(); 
```

## File: backend/src/scrapers/postScraper.js
```javascript
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class PostScraper {
  constructor() {
    this.client = axios.create({
      baseURL: config.rapidApi.baseUrl,
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host
      }
    });
  }

  async scrapeUserPosts(username, limit = 10) {
    try {
      logger.info(`Starting post scrape for username: ${username}, limit: ${limit}`);
      
      const response = await this.client.get(config.rapidApi.endpoints.posts, {
        params: { 
          username_or_id_or_url: username,
          limit 
        }
      });

      logger.debug('Raw posts response:', JSON.stringify(response.data, null, 2));

      const postsData = Array.isArray(response.data) ? response.data : [];
      
      return postsData.map(post => ({
        username,
        scrapedAt: new Date().toISOString(),
        ...post
      }));

      logger.info(`Successfully scraped ${postsData.length} posts for ${username}`);
      return postsData;
      
    } catch (error) {
      logger.error(`Error scraping posts for ${username}:`, error);
      throw error;
    }
  }
}

module.exports = new PostScraper(); 
```

## File: backend/src/jobs/scrapeOrchestrator.js
```javascript
const logger = require('../utils/logger');
const profileScraper = require('../scrapers/profileScraper');
const dataHandler = require('../storage/dataHandler');
const bigQueryClient = require('../storage/bigQueryClient');

class ScrapeOrchestrator {
  async initialize() {
    try {
      logger.info('Initializing tables...');
      // Only create if doesn't exist
      await bigQueryClient.createTableIfNotExists('profiles');
      logger.info('Tables initialized successfully');
    } catch (error) {
      logger.error('Error initializing tables:', error);
      throw error;
    }
  }

  async scrapeAndStoreProfile(username) {
    try {
      // 