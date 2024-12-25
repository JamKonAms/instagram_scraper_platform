const schemas = {
  profiles: [
    { name: 'username', type: 'STRING', mode: 'REQUIRED' },
    { name: 'scrapedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'fullName', type: 'STRING' },
    { name: 'biography', type: 'STRING' },
    { name: 'externalUrl', type: 'STRING' },
    { name: 'followerCount', type: 'INTEGER' },
    { name: 'followingCount', type: 'INTEGER' },
    { name: 'isPrivate', type: 'BOOLEAN' },
    { name: 'isVerified', type: 'BOOLEAN' },
    { name: 'profilePicUrl', type: 'STRING' },
    { name: 'mediaCount', type: 'INTEGER' },
    { name: 'userId', type: 'STRING' },
    { name: 'isBusinessAccount', type: 'BOOLEAN' },
    { name: 'category', type: 'STRING' },
    { name: 'publicEmail', type: 'STRING' },
    { name: 'businessContactMethod', type: 'STRING' },
    { name: 'bioLinks', type: 'STRING' },
    { name: 'biographyWithEntities', type: 'STRING' },
    { name: 'profilePicUrlHd', type: 'STRING' },
    { name: 'totalIgtvVideos', type: 'INTEGER' }
  ]
  // ... other schemas
};

module.exports = schemas; 