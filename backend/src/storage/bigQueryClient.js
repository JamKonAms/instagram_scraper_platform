const { BigQuery } = require('@google-cloud/bigquery');
const logger = require('../utils/logger');
const config = require('../config');

class BigQueryClient {
  constructor() {
    // Single source of truth for all table schemas
    this.schemas = {
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
        { name: 'bioLinks', type: 'STRING' },
        { name: 'biographyWithEntities', type: 'STRING' },
        { name: 'profilePicUrlHd', type: 'STRING' }
      ],
      posts: [
        { name: 'username', type: 'STRING', mode: 'REQUIRED' },
        { name: 'postId', type: 'STRING', mode: 'REQUIRED' },
        { name: 'scrapedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'shortcode', type: 'STRING' },
        { name: 'caption', type: 'STRING' },
        { name: 'likeCount', type: 'INTEGER' },
        { name: 'commentCount', type: 'INTEGER' },
        { name: 'mediaType', type: 'STRING' },
        { name: 'mediaUrl', type: 'STRING' },
        { name: 'thumbnailUrl', type: 'STRING' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'locationName', type: 'STRING' },
        { name: 'locationId', type: 'STRING' },
        { name: 'hashtags', type: 'STRING' },
        { name: 'mentions', type: 'STRING' },
        { name: 'isVideo', type: 'BOOLEAN' },
        { name: 'videoDuration', type: 'FLOAT' },
        { name: 'viewCount', type: 'INTEGER' },
        { name: 'productType', type: 'STRING' }
      ],
      followers: [
        // ... follower schema fields
      ]
    };

    this.bigquery = new BigQuery({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.credentials,
      location: 'EU'
    });
    this.dataset = config.googleCloud.bigquery.dataset;
  }

  // Method to get schema for validation
  getSchema(tableName) {
    return this.schemas[tableName];
  }

  validateDataAgainstSchema(tableName, data) {
    const schema = this.schemas[tableName];
    const errors = [];

    // Check required fields
    schema.forEach(field => {
      if (field.mode === 'REQUIRED' && !data[field.name]) {
        errors.push(`Missing required field: ${field.name}`);
      }
    });

    // Check data types
    Object.entries(data).forEach(([key, value]) => {
      const fieldSchema = schema.find(f => f.name === key);
      if (!fieldSchema) {
        errors.push(`Unknown field: ${key}`);
        return;
      }

      // Type validation
      switch (fieldSchema.type) {
        case 'STRING':
          if (value && typeof value !== 'string') {
            errors.push(`Field ${key} must be a string`);
          }
          break;
        case 'INTEGER':
          if (value && !Number.isInteger(Number(value))) {
            errors.push(`Field ${key} must be an integer`);
          }
          break;
        case 'BOOLEAN':
          if (value !== null && typeof value !== 'boolean') {
            errors.push(`Field ${key} must be a boolean`);
          }
          break;
        case 'TIMESTAMP':
          if (value && isNaN(Date.parse(value))) {
            errors.push(`Field ${key} must be a valid timestamp`);
          }
          break;
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async insertData(tableName, rows) {
    try {
      logger.info(`Validating ${rows.length} rows for ${tableName}`);
      
      // Clean the data before insertion
      const cleanedRows = rows.map(row => ({
        ...row,
        // Ensure proper data types
        username: String(row.username),
        scrapedAt: new Date(row.scrapedAt).toISOString(),
        userId: String(row.userId),
        followerCount: Number(row.followerCount),
        followingCount: Number(row.followingCount),
        mediaCount: Number(row.mediaCount),
        totalIgtvVideos: Number(row.totalIgtvVideos),
        isPrivate: Boolean(row.isPrivate),
        isVerified: Boolean(row.isVerified),
        isBusinessAccount: Boolean(row.isBusinessAccount),
        // Truncate long strings if needed
        bioLinks: row.bioLinks ? row.bioLinks.substring(0, 1000) : null,
        biographyWithEntities: row.biographyWithEntities ? row.biographyWithEntities.substring(0, 1000) : null
      }));

      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);

      const options = {
        schema: this.schemas[tableName],
        createInsertId: true,
        ignoreUnknownValues: true, // Ignore extra fields
        raw: true,
        // Add explicit type conversion
        templateSuffix: '_template'
      };

      logger.info(`Inserting ${rows.length} rows into ${tableName}`);
      const [response] = await table.insert(cleanedRows, options);

      if (response && response.insertErrors) {
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

  async createTableIfNotExists(tableName, schema) {
    try {
      const dataset = this.bigquery.dataset(this.dataset);
      const [tableExists] = await dataset.table(tableName).exists();
      
      if (!tableExists) {
        logger.info(`Creating table ${tableName}`);
        await dataset.createTable(tableName, { schema });
        logger.info(`Successfully created table ${tableName}`);
      }
      
    } catch (error) {
      logger.error(`Error creating table ${tableName}:`, error);
      throw error;
    }
  }

  async recreateTable(tableName) {
    try {
      logger.info(`Recreating table ${tableName}`);
      
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);
      
      // Check if table exists
      const [exists] = await table.exists();
      if (exists) {
        logger.info(`Dropping existing table ${tableName}`);
        await table.delete();
      }
      
      // Create new table with schema
      logger.info(`Creating new table ${tableName}`);
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

  async verifyTableSchema(tableName) {
    try {
      logger.info(`Verifying schema for table ${tableName}`);
      
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);
      
      // Get current table metadata
      const [metadata] = await table.getMetadata();
      const currentSchema = metadata.schema.fields;
      
      // Compare with our schema
      const expectedSchema = this.schemas[tableName];
      
      logger.debug('Schema comparison:', {
        current: currentSchema,
        expected: expectedSchema
      });
      
      // Check for missing or mismatched fields
      const differences = [];
      expectedSchema.forEach(field => {
        const currentField = currentSchema.find(f => f.name === field.name);
        if (!currentField) {
          differences.push(`Missing field: ${field.name}`);
        } else if (currentField.type !== field.type) {
          differences.push(`Type mismatch for ${field.name}: expected ${field.type}, got ${currentField.type}`);
        }
      });
      
      if (differences.length > 0) {
        logger.warn('Schema differences found:', differences);
        return false;
      }
      
      logger.info('Table schema verified successfully');
      return true;
      
    } catch (error) {
      logger.error(`Error verifying table schema:`, error);
      throw error;
    }
  }
}

// Add test function
async function testConnection() {
  const client = new BigQueryClient();
  try {
    // Test table exists
    console.log('Testing table schema...');
    const isValid = await client.verifyTableSchema('profiles');
    console.log('Schema valid:', isValid);

    // Show current schema
    console.log('Current schema:', client.schemas.profiles);
  } catch (error) {
    console.error('BigQuery Error:', error);
  }
}

// Export for testing
module.exports = {
  default: new BigQueryClient(),
  testConnection
}; 