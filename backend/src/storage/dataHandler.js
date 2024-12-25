const logger = require('../utils/logger');
const schemas = require('./schemas');  // Import schemas

class DataHandler {
  constructor() {
    this.schemas = schemas;  // Store schemas
  }

  validateProfileData(data) {
    const schema = this.schemas.profiles;
    const errors = [];

    // Check each field against schema
    schema.forEach(field => {
      const value = data[field.name];
      
      // Check required fields
      if (field.mode === 'REQUIRED' && (value === undefined || value === null)) {
        errors.push(`Missing required field: ${field.name}`);
        return;
      }

      // Type validation
      if (value !== undefined && value !== null) {
        switch (field.type) {
          case 'STRING':
            if (typeof value !== 'string') {
              errors.push(`Field ${field.name} must be string, got ${typeof value}`);
            }
            break;
          case 'INTEGER':
            if (!Number.isInteger(value)) {
              errors.push(`Field ${field.name} must be integer, got ${typeof value}`);
            }
            break;
          case 'BOOLEAN':
            if (typeof value !== 'boolean') {
              errors.push(`Field ${field.name} must be boolean, got ${typeof value}`);
            }
            break;
          case 'TIMESTAMP':
            if (!(value instanceof Date) && !Date.parse(value)) {
              errors.push(`Field ${field.name} must be valid timestamp`);
            }
            break;
        }
      }
    });

    return errors;
  }

  transformProfileData(profileData) {
    try {
      const transformed = {
        username: profileData.username,
        scrapedAt: profileData.scrapedAt,
        fullName: profileData.full_name,
        biography: profileData.biography,
        externalUrl: profileData.external_url,
        followerCount: parseInt(profileData.follower_count, 10) || 0,
        followingCount: parseInt(profileData.following_count, 10) || 0,
        isPrivate: Boolean(profileData.is_private),
        isVerified: Boolean(profileData.is_verified),
        profilePicUrl: profileData.profile_pic_url,
        mediaCount: parseInt(profileData.media_count, 10) || 0,
        userId: profileData.id,
        isBusinessAccount: Boolean(profileData.is_business),
        category: profileData.category,
        publicEmail: profileData.public_email,
        businessContactMethod: profileData.business_contact_method,
        bioLinks: JSON.stringify(profileData.bio_links || []),
        biographyWithEntities: JSON.stringify(profileData.biography_with_entities || {}),
        profilePicUrlHd: profileData.profile_pic_url_hd,
        totalIgtvVideos: parseInt(profileData.total_igtv_videos, 10) || 0
      };

      // Validate before returning
      const validationErrors = this.validateProfileData(transformed);
      if (validationErrors.length > 0) {
        logger.error('Profile data validation failed:', {
          errors: validationErrors,
          data: transformed
        });
        throw new Error(`Profile data validation failed: ${validationErrors.join(', ')}`);
      }

      // Log the transformed data
      logger.debug('Transformed profile data:', JSON.stringify(transformed, null, 2));

      return transformed;
    } catch (error) {
      logger.error('Error transforming profile data:', error);
      throw error;
    }
  }

  transformPostData(postData) {
    try {
      return {
        username: postData.username,
        postId: postData.id,
        scrapedAt: new Date().toISOString(),
        shortcode: postData.shortcode,
        caption: postData.caption,
        likeCount: parseInt(postData.like_count, 10),
        commentCount: parseInt(postData.comment_count, 10),
        mediaType: postData.media_type,
        mediaUrl: postData.media_url,
        thumbnailUrl: postData.thumbnail_url,
        timestamp: postData.timestamp,
        locationName: postData.location?.name,
        locationId: postData.location?.id,
        hashtags: JSON.stringify(postData.hashtags || []),
        mentions: JSON.stringify(postData.mentions || []),
        isVideo: Boolean(postData.is_video),
        videoDuration: parseFloat(postData.video_duration),
        viewCount: parseInt(postData.view_count, 10),
        productType: postData.product_type
      };
    } catch (error) {
      logger.error('Error transforming post data:', error);
      throw error;
    }
  }

  transformFollowerData(followerData, mainUsername) {
    try {
      return {
        username: mainUsername,
        scrapedAt: new Date().toISOString(),
        followerUsername: followerData.username,
        followerUserId: followerData.id,
        followerFullName: followerData.full_name,
        followerBiography: followerData.biography,
        followerProfilePicUrl: followerData.profile_pic_url,
        isPrivate: Boolean(followerData.is_private),
        isVerified: Boolean(followerData.is_verified),
        followerCount: parseInt(followerData.follower_count, 10),
        followingCount: parseInt(followerData.following_count, 10)
      };
    } catch (error) {
      logger.error('Error transforming follower data:', error);
      throw error;
    }
  }
}

module.exports = new DataHandler(); 