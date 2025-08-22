export const DATABASE_CONFIG = {
  DATABASE_ID: 'mitchly-music-db',
  SONGS_COLLECTION: 'songs'
};

export const POLLING_CONFIG = {
  RATE_LIMIT_COOLDOWN: parseInt(process.env.RATE_LIMIT_COOLDOWN || '20000'),
  INITIAL_DELAY: parseInt(process.env.INITIAL_DELAY || '30000'),
  API_CALL_DELAY: parseInt(process.env.API_CALL_DELAY || '500'),
  MAX_SONGS_PER_RUN: 25,
  TIMEOUT_MINUTES: 30
};
