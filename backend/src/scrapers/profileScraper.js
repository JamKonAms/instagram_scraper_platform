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