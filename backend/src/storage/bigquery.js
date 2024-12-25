const { BigQuery } = require('@google-cloud/bigquery');
const logger = require('../utils/logger');

class BigQueryClient {
  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }

  async saveData(dataset, table, data) {
    try {
      await this.bigquery
        .dataset(dataset)
        .table(table)
        .insert(data);
      logger.info('Data saved to BigQuery successfully');
    } catch (error) {
      logger.error('Error saving to BigQuery:', error);
      throw error;
    }
  }
}

module.exports = new BigQueryClient(); 