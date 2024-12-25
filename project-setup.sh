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