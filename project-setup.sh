#!/bin/bash

mkdir instagram-scraper
cd instagram-scraper
mkdir backend frontend docs 
mkdir -p backend/src/{api,scrapers,storage,jobs,utils}

# Initialize backend
cd backend
npm init -y  # Create initial package.json
npm install express dotenv @google-cloud/bigquery axios node-cron winston cors
npm install --save-dev jest nodemon

# Return to project root
cd .. 

# Update any references to bigquery.js
sed -i '' 's/bigquery/bigQueryClient/g' backend/src/**/*.js

# Remove old file
rm -f backend/src/storage/bigquery.js

# Verify BigQuery connection
node -e "
const bigQueryClient = require('./backend/src/storage/bigQueryClient');
bigQueryClient.verifyTableSchema('profiles')
  .then(valid => console.log('Schema verification:', valid ? 'OK' : 'Failed'))
  .catch(console.error)
" 