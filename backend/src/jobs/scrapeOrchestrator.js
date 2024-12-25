const profileScraper = require('../scrapers/profileScraper');
const postScraper = require('../scrapers/postScraper');
const bigQueryClient = require('../storage/bigQueryClient');
const dataHandler = require('../storage/dataHandler');
const logger = require('../utils/logger');
const config = require('../config');

class ScrapeOrchestrator {
  async initialize() {
    // Create tables if they don't exist
    await bigQueryClient.createTableIfNotExists(
      config.googleCloud.bigquery.tables.profiles,
      dataHandler.schemas.profiles
    );
    await bigQueryClient.createTableIfNotExists(
      config.googleCloud.bigquery.tables.posts,
      dataHandler.schemas.posts
    );
  }

  async scrapeAndStoreProfile(username) {
    try {
      // Scrape profile data
      const rawProfileData = await profileScraper.scrapeProfile(username);
      
      // Transform data to match BigQuery schema
      const transformedData = dataHandler.transformProfileData(rawProfileData);
      
      // Store in BigQuery
      await bigQueryClient.insertData(
        config.googleCloud.bigquery.tables.profiles,
        [transformedData]
      );

      logger.info(`Successfully processed profile data for ${username}`);
      return transformedData;
      
    } catch (error) {
      logger.error(`Error in profile scrape and store flow for ${username}:`, error);
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