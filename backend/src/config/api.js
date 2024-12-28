module.exports = {
  rapidApi: {
    key: process.env.RAPIDAPI_KEY,
    host: process.env.RAPIDAPI_HOST,
    endpoints: {
      profile: '/v1/info',
      followers: '/v1/followers',
      following: '/v1/following',
      posts: '/v1.2/posts'
    }
  }
}; 