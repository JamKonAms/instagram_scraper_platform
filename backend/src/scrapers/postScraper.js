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