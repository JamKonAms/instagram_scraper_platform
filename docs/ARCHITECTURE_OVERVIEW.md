# Instagram Scraper Architecture Overview

## Project Structure 

# ARCHITECTURE_OVERVIEW.md

## 1. Introduction

**Project Purpose**  
- This project scrapes Instagram data (via RapidAPI) and stores it in BigQuery.  
- A front-end interface allows users to create or schedule scraping jobs by inputting usernames and specifying data types (profiles, posts, stories).  
- Google Looker handles in-depth analytics directly from BigQuery—this project’s interface focuses on job creation/management only.

**High-Level Goals**  
- Keep the codebase **simple**, **modular**, and **maintainable**.  
- Centralize configurations and environment variables.  
- Provide a robust but minimal front-end for job creation.  
- Store data in a consistent schema for easy analysis in Looker.

---

## 2. Folder & File Structure

instagram-scraper/
├── backend/
│ ├── src/
│ │ ├── scrapers/
│ │ │ ├── profileScraper.js  # Handles API calls to instagram-scraper-api2
│ │ │ └── postScraper.js     # Uses same API endpoint
│ │ ├── api/
│ │ │ └── rapidApiClient.js # Encapsulates all calls to RapidAPI
│ │ ├── scrapers/
│ │ │ ├── profileScraper.js # For profiles
│ │ │ ├── postScraper.js # For posts
│ │ │ └── storyScraper.js # For stories
│ │ ├── storage/
│ │ │ ├── bigQueryClient.js # Handles BQ connections & schemas
│ │ │ └── dataHandler.js    # Data transformations before insertion
│ │ ├── jobs/
│ │ │ └── scheduler.js # Schedules scraping jobs
│ │ ├── utils/
│ │ │ ├── logger.js # Central logging utility
│ │ │ └── errorHandler.js # Central error handling
│ │ ├── config.js # Loads env vars & shared config
│ │ └── index.js # Main backend entry point
│ ├── tests/ # Unit & integration tests
│ ├── .env # Environment variables (excluded from VCS)
│ ├── .gitignore
│ ├── package.json
│ └── README.md
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/ # Abstract API calls to backend
│ │ ├── App.js
│ │ └── index.js
│ ├── .env
│ ├── .gitignore
│ ├── package.json
│ └── README.md
├── docs/
│ └── ARCHITECTURE_OVERVIEW.md # This document
└── README.md # High-level project introduction

**Key Conventions**  
- **Naming**: Use `camelCase` for JavaScript files, `PascalCase` for React components.  
- **Testing**: Tests reside in `tests/` with a similar folder structure as `src/`.  
- **Documentation**: All architecture decisions live in this file or in relevant sub-`README`s.

---

## 3. Data Flow

1. **Front-End** (Job Management):  
   - User inputs: Instagram username, data type (profile/post/story), optional scheduling details.  
   - Sends job creation requests to the back-end (e.g., `POST /api/scrape-job`).

2. **Back-End**:  
   - **Scheduler** (if used): Registers or runs scraping tasks.  
   - **Scrapers**: Calls the RapidAPI Instagram endpoint, gathers requested data.  
   - **Storage**: Transforms and inserts data into BigQuery.

3. **BigQuery**:  
   - Stores all scraped data in a well-defined schema.  
   - Google Looker connects here for analytics and reporting—**not** part of this codebase.

## Database Configuration

### Storage Components
- `bigQueryClient.js`: Handles all BigQuery operations including:
  - Schema definitions (single source of truth)
  - Table operations (create, insert, verify)
  - Data validation
  - Error handling

### Schema Management
All table schemas are defined in `bigQueryClient.js` as a single source of truth.
This ensures:
- No duplicate schema definitions
- Consistent validation across the application
- Centralized schema updates
- Easy schema verification against BigQuery tables

### File Structure
instagram-scraper/
├── backend/
│ ├── src/
│ │ ├── storage/
│ │ │ ├── bigQueryClient.js  # All BigQuery operations
│ │ │ └── dataHandler.js     # Data transformations

### BigQuery Setup
- **Project ID**: `godspeed-416117`
- **Dataset**: `instagram_data`
- **Location**: `EU` (European Union multi-region)

### Tables
- **profiles**: Stores Instagram user profile data
- **posts**: Stores post and reel data
- **followers**: Stores follower relationship data
- **following**: Stores following relationship data

---

## 4. Environment Variables & Configuration

- **`backend/.env`**  
  - `RAPIDAPI_KEY` = API key for the Instagram scraper.  
  - `GOOGLE_CLOUD_PROJECT` = godspeed-416117
  - `BQ_DATASET` = instagram_data
  - `GOOGLE_APPLICATION_CREDENTIALS` = /Users/jamiekonincks/Documents/coding/godspeed/instagram_scraper_platform/backend/google_service_account.json
  - `SCHEDULER_CRON` = Cron expression for scheduling, if any.

- **`frontend/.env`**  
  - `REACT_APP_BACKEND_URL` = The base URL for the back-end API (if React is used).  
  - Additional front-end environment vars as needed.

**Security**:  
- Never commit actual API keys or credentials.  
- Keep `.env` in `.gitignore`.

---

## 5. API Endpoints & Integration Points

- **`POST /api/scrape-job`**  
  - Body: `{ username: string, dataType: string, schedule?: string }`
  - Action: Creates a new scraping job (immediate or scheduled).

- **`GET /api/scrape-job/:id` (optional)**  
  - Retrieves status of a specific scrape job.

- **Front-End Services**  
  - A minimal `services/` module calls these endpoints for job creation and optional status checks.

---

## 6. Testing Strategy

- **Backend**:  
  - **Unit Tests** for scraper functions, API clients, data handlers.  
  - **Integration Tests** for entire flow (mocking RapidAPI & BigQuery if possible).

- **Frontend**:  
  - Basic tests for form components and `services/` calls.  
  - Could use Jest + React Testing Library (or your framework’s testing tools).

---

## 7. Deployment & Iteration

- **Deployment**:  
  - Each environment (dev, staging, production) has its own `.env` or secrets management.  
  - Front-end and back-end can be deployed separately or as part of a mono-repo pipeline.

- **Ongoing Updates**:  
  - Keep this `ARCHITECTURE_OVERVIEW.md` file updated with major structural or endpoint changes.  
  - Document new modules in this file as you add them.

---

## 8. Conclusion

This file should be the **single source of truth** for the project’s organization and high-level design decisions. Refer to it often and keep it updated as the project evolves.

---

### Endpoints

1. **Profile Info**  
GET https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url={username}

2. **Followers**  
GET https://instagram-scraper-api2.p.rapidapi.com/v1/followers?username_or_id_or_url={username}

3. **Following**  


Thought for 5 seconds
Below is an updated prompt that incorporates the correct RapidAPI host and endpoints for the “instagram-scraper-api2” service. It also includes a snippet you can add to your single source of truth document to clarify how these environment variables and endpoints are configured.

Prompt: Validate & Refine API Responses, Data Flow, and Database Structure (Updated Endpoints)
“Hello AI coder! We’ve updated our RapidAPI host and endpoints for the Instagram scraper. Our .env file and config.js must reflect these changes accurately. Here’s the current info:

RapidAPI Host & Key

RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com
RAPIDAPI_KEY=your_api_key_here
We also have PROJECT_ID=godspeed-416117 for BigQuery.
Correct Endpoints

Profiles:
`GET https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url={username}`
Followers:
`GET https://instagram-scraper-api2.p.rapidapi.com/v1/followers?username_or_id_or_url={username}`
Following:
`GET https://instagram-scraper-api2.p.rapidapi.com/v1/following?username_or_id_or_url={username}`
Posts & Reels:
`GET https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts?username_or_id_or_url={username}`
Task
Integrate Updated Endpoints

Please update any scraper files (profileScraper.js, postScraper.js, etc.) so they use the correct base URL, path, and query parameter (username_or_id_or_url).
Ensure config.rapidApi.baseUrl or whichever variable we’re using is updated or replaced with "https://instagram-scraper-api2.p.rapidapi.com".
Validate Raw Responses

We need a real or mock example of each endpoint’s JSON response. Please request it or generate a mock so we can confirm the fields we’ll store in BigQuery.
Compare the actual keys (e.g., username, followers_count, etc.) with what we transform in dataHandler.js.
Refine Data Flow & BigQuery Schemas

If the new endpoints return different fields or nested objects, we may need to adjust our transformation functions (transformProfileData, etc.).
Update the schemas in dataHandler.js if we have new columns or data types to store.
Keep everything consistent with our single source of truth document.
Where to Store Credentials & Endpoints

We keep RAPIDAPI_KEY, RAPIDAPI_HOST, and PROJECT_ID in the .env file.
config.js loads these environment variables.
If additional environment variables are needed (e.g., for the new posts endpoint), please note them.
Output Format

Provide short code snippets for any scraper or config file changes.
Summarize in bullet points how each endpoint’s data structure fits into our existing BigQuery schema.
If changes are needed, show an updated dataHandler.js snippet with the revised transformations.
Objective: We want to ensure our scrapers correctly call the new endpoints and store the right data in BigQuery. Let me know if you need sample responses from these endpoints, or any further environment variable details!”

---

## API Integration

### External APIs
We use RapidAPI's Instagram Scraper v2 for all Instagram data:
- Base URL: `instagram-scraper-api2.p.rapidapi.com`
- Endpoints:
  - Profile: `GET /v1/info`
  - Followers: `GET /v1/followers`
  - Following: `GET /v1/following`
  - Posts: `GET /v1.2/posts`

### Implementation
- `profileScraper.js`: Handles all API calls directly
- No separate API client layer needed
- Consistent error handling and logging

### File Structure Update
instagram-scraper/
├── backend/
│ ├── src/
│ │ ├── scrapers/           # All API interaction happens here
│ │ │ ├── profileScraper.js # Handles profile, follower, following
│ │ │ └── postScraper.js    # Handles posts and media

