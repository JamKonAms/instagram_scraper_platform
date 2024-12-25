const { BigQuery } = require('@google-cloud/bigquery');
const logger = require('../utils/logger');
const config = require('../config');

class BigQueryClient {
  constructor() {
    this.schemas = {
      profiles: [
        { name: 'username', type: 'STRING', mode: 'REQUIRED' },
        // ... rest of schema
      ]
    };
    
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
      
      // Log the exact data being inserted
      logger.debug('Data to insert:', {
        tableName,
        schema: this.schemas[tableName],
        rows: JSON.stringify(rows, null, 2)
      });
      
      const dataset = this.bigquery.dataset(this.dataset);
      const table = dataset.table(tableName);

      const [apiResponse] = await table.insert(rows, {
        schema: this.schemas[tableName],
        createInsertId: true,
        ignoreUnknownValues: false, // Fail on unknown fields
        raw: true // Get detailed error responses
      });
      
      logger.info(`Successfully inserted data into ${tableName}`);
      return apiResponse;
      
    } catch (error) {
      // Detailed error logging
      if (error.name === 'PartialFailureError') {
        const insertErrors = error.response?.insertErrors || [];
        logger.error('BigQuery Partial Failure:', {
          error: error.message,
          rowErrors: insertErrors.map(err => ({
            row: err.row,
            errors: err.errors.map(e => ({
              reason: e.reason,
              location: e.location,
              message: e.message
            }))
          }))
        });
      } else {
        logger.error(`Error inserting data into ${tableName}:`, {
          errorType: error.name,
          message: error.message,
          stack: error.stack,
          details: error.response
        });
      }
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

module.exports = new BigQueryClient(); 