module.exports = {
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    bigquery: {
      dataset: process.env.BQ_DATASET || 'instagram_data',
      tables: {
        profiles: 'profiles',
        posts: 'posts',
        stories: 'stories'
      }
    }
  }
}; 