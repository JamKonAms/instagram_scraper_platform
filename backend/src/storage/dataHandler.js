const logger = require('../utils/logger');
const { safeString } = require('../utils/stringUtils');

class DataHandler {
  transformProfileData(rawData) {
    try {
      const data = rawData.data;
      
      return {
        // Required fields
        username: String(data.username),
        scrapedAt: new Date().toISOString(),
        userId: String(data.id),

        // Optional fields with type conversion
        fullName: safeString(data.full_name),
        biography: safeString(data.biography)?.substring(0, 1000),
        externalUrl: safeString(data.external_url),
        followerCount: parseInt(data.follower_count) || 0,
        followingCount: parseInt(data.following_count) || 0,
        isPrivate: Boolean(data.is_private),
        isVerified: Boolean(data.is_verified),
        profilePicUrl: safeString(data.profile_pic_url),
        mediaCount: parseInt(data.media_count) || 0,
        totalIgtvVideos: parseInt(data.total_igtv_videos) || 0,
        isBusinessAccount: Boolean(data.is_business),
        category: safeString(data.category),
        publicEmail: safeString(data.public_email),
        
        // Complex fields
        bioLinks: transformBioLinks(data.bio_links),
        biographyWithEntities: data.biography_with_entities ? 
          JSON.stringify(data.biography_with_entities) : null,
        profilePicUrlHd: safeString(data.profile_pic_url_hd)
      };
    } catch (error) {
      logger.error('Error transforming profile data:', error);
      throw error;
    }
  }
}

function transformBioLinks(links) {
  if (!links) return null;
  
  try {
    return links.map(link => ({
      title: String(link.title || ''),
      url: String(link.url?.split('?')[0] || ''), // Remove query params
      linkType: String(link.link_type || '')
    }));
  } catch (error) {
    logger.error('Error transforming bio links:', error);
    return null;
  }
}

module.exports = new DataHandler(); 