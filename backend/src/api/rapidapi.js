const axios = require('axios');
const logger = require('../utils/logger');

class InstagramAPI {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://instagram-data1.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      }
    });
  }

  async fetchUserData(username) {
    try {
      const response = await this.client.get(`/user/${username}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching Instagram data:', error);
      throw error;
    }
  }
}

module.exports = new InstagramAPI(); 