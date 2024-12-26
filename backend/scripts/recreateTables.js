const bigQueryClient = require('../src/storage/bigQueryClient');
const logger = require('../src/utils/logger');

async function recreateTables() {
  try {
    await bigQueryClient.recreateTable('profiles');
    logger.info('Successfully recreated tables');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to recreate tables:', error);
    process.exit(1);
  }
}

recreateTables(); 