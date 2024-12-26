const profileScraper = require('../scrapers/profileScraper');
const dataHandler = require('../storage/dataHandler');
const bigQueryClient = require('../storage/bigQueryClient');
const stringUtils = require('../utils/stringUtils');

async function runTests() {
  try {
    // 1. Test API Scrape
    console.log('1. Testing API Scrape...');
    const rawData = await profileScraper.scrapeProfile('wietskeoverdijk');
    console.log('API Response:', rawData);

    // 2. Test Data Transform
    console.log('\n2. Testing Data Transform...');
    console.log('DataHandler methods:', Object.keys(dataHandler));
    const transformedData = dataHandler.transformProfileData(rawData);
    console.log('Transformed Data:', transformedData);

    // 3. Test BigQuery Connection
    console.log('\n3. Testing BigQuery Connection...');
    // For tests, we want to ensure a clean state
    console.log('Ensuring clean test environment...');
    await bigQueryClient.recreateTable('profiles');

    // 4. Test Data Insertion
    console.log('\n4. Testing Data Insertion...');
    await bigQueryClient.insertData('profiles', [transformedData]);
    console.log('Data inserted successfully!');

    // 5. Test String Utils
    console.log('\nTesting String Utils...');
    const testObj = {
      text: "Hello 👋 World ✨",
      nested: { emoji: "🌟" },
      invalid: "Test \uFFFD char"
    };
    console.log('Safe string conversion:', stringUtils.safeString(JSON.stringify(testObj)));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests(); 