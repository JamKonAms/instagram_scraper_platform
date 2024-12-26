// BigQuery table schemas
module.exports = {
  profiles: [
    { name: 'username', type: 'STRING', mode: 'REQUIRED' },
    { name: 'scrapedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'userId', type: 'STRING', mode: 'REQUIRED' },
    { name: 'fullName', type: 'STRING' },
    { name: 'biography', type: 'STRING' },
    { name: 'externalUrl', type: 'STRING' },
    { name: 'followerCount', type: 'INTEGER' },
    { name: 'followingCount', type: 'INTEGER' },
    { name: 'isPrivate', type: 'BOOLEAN' },
    { name: 'isVerified', type: 'BOOLEAN' },
    { name: 'profilePicUrl', type: 'STRING' },
    { name: 'mediaCount', type: 'INTEGER' },
    { name: 'totalIgtvVideos', type: 'INTEGER' },
    { name: 'isBusinessAccount', type: 'BOOLEAN' },
    { name: 'category', type: 'STRING' },
    { name: 'publicEmail', type: 'STRING' },
    { 
      name: 'bioLinks', 
      type: 'RECORD', 
      mode: 'REPEATED',
      fields: [
        { name: 'title', type: 'STRING' },
        { name: 'url', type: 'STRING' },
        { name: 'linkType', type: 'STRING' }
      ]
    },
    { name: 'biographyWithEntities', type: 'STRING' },
    { name: 'profilePicUrlHd', type: 'STRING' }
  ]
}; 