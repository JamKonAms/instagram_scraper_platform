const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class ProfileScraper {
  constructor() {
    this.client = axios.create({
      baseURL: config.rapidApi.baseUrl,
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host
      }
    });
  }

  async scrapeProfile(username) {
    try {
      logger.info(`Starting profile scrape for username: ${username}`);
      
      // Log the request configuration
      logger.debug('Request config:', {
        url: `${this.client.defaults.baseURL}${config.rapidApi.endpoints.profile}`,
        headers: this.client.defaults.headers,
        params: { username_or_id_or_url: username }
      });
      
      const response = await this.client.get(config.rapidApi.endpoints.profile, {
        params: { 
          username_or_id_or_url: username 
        }
      });

      // Log the raw response for debugging
      logger.debug('Raw API response:', JSON.stringify(response.data, null, 2));

      // Pass the nested data object to the transformer
      const profileData = {
        username,
        scrapedAt: new Date().toISOString(),
        ...response.data.data  // The actual profile data is nested under 'data'
      };

      logger.info(`Successfully scraped profile for ${username}`);
      return profileData;
      
    } catch (error) {
      logger.error('Error scraping profile:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
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

module.exports = new ProfileScraper(); 