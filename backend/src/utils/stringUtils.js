/**
 * Safely converts values to strings, handling emojis and special characters
 */
function safeString(str) {
  if (!str) return str;
  
  // Handle JSON strings
  if (typeof str === 'string' && (str.startsWith('{') || str.startsWith('['))) {
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed);
    } catch (e) {
      return str;
    }
  }
  
  return str;
}

module.exports = {
  safeString
}; 