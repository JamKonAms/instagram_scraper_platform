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
      // 1. Scrape profile data
      const rawData = await profileScraper.scrapeProfile(username);
      
      // 2. Transform data
      const transformedData = dataHandler.transformProfileData(rawData);
      
      // 3. Store in BigQuery
      await bigQueryClient.insertData('profiles', [transformedData]);
      
      return transformedData;
    } catch (error) {
      logger.error(`Error processing profile for ${username}:`, error);
      throw error;
    }
  }
}

module.exports = new ScrapeOrchestrator(); 