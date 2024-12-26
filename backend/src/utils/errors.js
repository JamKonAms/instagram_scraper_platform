// Add custom error classes
class InstagramScraperError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'InstagramScraperError';
    this.code = code;
    this.originalError = originalError;
  }
}

class BigQueryError extends Error {
  constructor(message, operation, originalError = null) {
    super(message);
    this.name = 'BigQueryError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

// Add more specific error types
class APIRateLimitError extends InstagramScraperError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  InstagramScraperError,
  BigQueryError,
  APIRateLimitError
}; 