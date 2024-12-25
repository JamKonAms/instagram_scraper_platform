const { testScrape } = require('../scrapers/profileScraper');
const { testTransform } = require('../storage/dataHandler');
const { testConnection } = require('../storage/bigQueryClient');

async function runTests() {
  try {
    console.log('1. Testing API Scrape...');
    const scraped = await testScrape();

    console.log('\n2. Testing Data Transform...');
    const transformed = await testTransform(scraped);

    console.log('\n3. Testing BigQuery Connection...');
    await testConnection();

    console.log('\n4. Testing Data Insertion...');
    const bigQueryClient = require('../storage/bigQueryClient').default;
    await bigQueryClient.insertData('profiles', [transformed]);
    console.log('Data inserted successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = runTests; 