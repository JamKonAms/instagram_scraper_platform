const axios = require('axios');
const logger = require('../utils/logger');

class RapidAPI {
  constructor(config) {
    this.client = axios.create({
      baseURL: 'https://instagram-scraper-api2.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host
      }
    });
  }
}

module.exports = new RapidAPI(); 