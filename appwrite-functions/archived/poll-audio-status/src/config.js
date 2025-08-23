export const DATABASE_CONFIG = {
  DATABASE_ID: 'mitchly-music-db',
  SONGS_COLLECTION: 'songs'
};

export const POLLING_CONFIG = {
  // Rate limiting and delays
  RATE_LIMIT_COOLDOWN: parseInt(process.env.RATE_LIMIT_COOLDOWN || '20000'), // 20 seconds
  INITIAL_DELAY: parseInt(process.env.INITIAL_DELAY || '30000'), // 30 seconds
  API_CALL_DELAY: parseInt(process.env.API_CALL_DELAY || '500'), // 0.5 seconds between API calls
  
  // Processing limits
  MAX_SONGS_PER_RUN: 25,
  TIMEOUT_MINUTES: 30,
  
  // Batch configuration for manual triggers
  BATCH_SIZE: 10,
  MAX_CONCURRENT_CHECKS: 5
};

export const MUREKA_CONFIG = {
  API_URL: 'https://api.mureka.ai/v2',
  VALID_STATUSES: {
    COMPLETED: ['completed', 'success'],
    FAILED: ['failed', 'error'],
    PROCESSING: ['pending', 'processing', 'queued']
  }
};
