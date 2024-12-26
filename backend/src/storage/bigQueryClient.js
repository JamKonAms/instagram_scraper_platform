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