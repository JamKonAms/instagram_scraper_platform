const bigQueryClient = require('../src/storage/bigQueryClient').default;
const logger = require('../src/utils/logger');

async function recreateAllTables() {
  try {
    logger.info('Starting table recreation...');
    
    // Recreate profiles table
    await bigQueryClient.recreateTable('profiles');
    
    // Add other tables as needed
    // await bigQueryClient.recreateTable('posts');
    
    logger.info('All tables recreated successfully');
  } catch (error) {
    logger.error('Error recreating tables:', error);
    process.exit(1);
  }
}

recreateAllTables(); 