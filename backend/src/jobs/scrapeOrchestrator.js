const profileScraper = require('../scrapers/profileScraper');
const postScraper = require('../scrapers/postScraper');
const bigQueryClient = require('../storage/bigQueryClient');
const dataHandler = require('../storage/dataHandler');
const logger = require('../utils/logger');
const config = require('../config');

class ScrapeOrchestrator {
  async initialize() {
    try {
      logger.info('Initializing tables...');
      
      // Create tables if they don't exist
      await bigQueryClient.createTableIfNotExists(
        'profiles',
        bigQueryClient.getSchema('profiles')
      );
      
      await bigQueryClient.createTableIfNotExists(
        'posts',
        bigQueryClient.getSchema('posts')
      );
      
      logger.info('Tables initialized successfully');
    } catch (error) {
      logger.error('Error initializing tables:', error);
      throw error;
    }
  }

  async scrapeAndStoreProfile(username) {
    try {
      // Scrape profile data
      const rawProfileData = await profileScraper.scrapeProfile(username);
      logger.debug('Raw API response:', {
        data: rawProfileData,
        structure: {
          hasData: !!rawProfileData,
          keys: rawProfileData ? Object.keys(rawProfileData) : [],
          dataType: typeof rawProfileData
        }
      });
      
      // Transform data
      const transformedData = dataHandler.transformProfileData(rawProfileData);
      logger.debug('Transformed data:', transformedData);
      
      // Store in BigQuery
      await bigQueryClient.insertData(
        'profiles',
        [transformedData]
      );

      logger.info(`Successfully processed profile data for ${username}`);
      return transformedData;
      
    } catch (error) {
      logger.error('Profile scrape error:', {
        message: error.message,
        rawData: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }

  async scrapeAndStorePosts(username, limit = 10) {
    try {
      // Scrape posts data
      const rawPostsData = await postScraper.scrapeUserPosts(username, limit);
      
      // Transform data to match BigQuery schema
      const transformedPosts = rawPostsData.map(post => 
        dataHandler.transformPostData(post)
      );
      
      // Store in BigQuery
      await bigQueryClient.insertData(
        config.googleCloud.bigquery.tables.posts,
        transformedPosts
      );

      logger.info(`Successfully processed ${transformedPosts.length} posts for ${username}`);
      return transformedPosts;
      
    } catch (error) {
      logger.error(`Error in posts scrape and store flow for ${username}:`, error);
      throw error;
    }
  }
}

module.exports = new ScrapeOrchestrator(); 