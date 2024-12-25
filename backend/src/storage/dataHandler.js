const logger = require('../utils/logger');
const bigQueryClient = require('./bigQueryClient');

class DataHandler {
  validateProfileData(data) {
    const schema = bigQueryClient.getSchema('profiles');
    // ... validation logic using schema from bigQueryClient
  }

  transformProfileData(rawData) {
    try {
      // Ensure we're working with the data object
      const data = rawData.data;
      
      return {
        username: String(data.username),
        scrapedAt: new Date().toISOString(),
        userId: String(data.id),
        fullName: data.full_name || null,
        biography: data.biography || null,
        externalUrl: data.external_url || null,
        followerCount: parseInt(data.follower_count) || 0,
        followingCount: parseInt(data.following_count) || 0,
        isPrivate: Boolean(data.is_private),
        isVerified: Boolean(data.is_verified),
        profilePicUrl: data.profile_pic_url || null,
        mediaCount: parseInt(data.media_count) || 0,
        totalIgtvVideos: parseInt(data.total_igtv_videos) || 0,
        isBusinessAccount: Boolean(data.is_business),
        category: data.category || null,
        publicEmail: data.public_email || null,
        bioLinks: data.bio_links ? JSON.stringify(data.bio_links) : null,
        biographyWithEntities: data.biography_with_entities ? JSON.stringify(data.biography_with_entities) : null,
        profilePicUrlHd: data.profile_pic_url_hd || null
      };
    } catch (error) {
      logger.error('Error transforming profile data:', error);
      throw error;
    }
  }

  // ... other transformation methods
}

// Add test function
async function testTransform(rawData) {
  const handler = new DataHandler();
  try {
    const transformed = handler.transformProfileData(rawData);
    console.log('Transformed Data:', JSON.stringify(transformed, null, 2));
    return transformed;
  } catch (error) {
    console.error('Transform Error:', error);
  }
}

// Export for testing
module.exports = {
  default: new DataHandler(),
  testTransform
}; 