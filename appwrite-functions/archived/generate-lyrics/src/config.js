export const DATABASE_CONFIG = {
  DATABASE_ID: 'mitchly-music-db',
  DATABASE_NAME: 'Mitchly Music Database',
  COLLECTIONS: {
    bands: {
      id: 'bands',
      name: 'Bands',
      permissions: [],
      documentSecurity: true,
      attributes: [
        { key: 'bandName', type: 'string', size: 255, required: true },
        { key: 'profileData', type: 'string', size: 10000, required: false },
        { key: 'primaryGenre', type: 'string', size: 100, required: false },
        { key: 'createdAt', type: 'datetime', required: true, default: null }
      ]
    },
    songs: {
      id: 'songs',
      name: 'Songs',
      permissions: [],
      documentSecurity: true,
      attributes: [
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'trackNumber', type: 'string', size: 10, required: true },
        { key: 'bandId', type: 'string', size: 36, required: false },
        { key: 'description', type: 'string', size: 1000, required: false },
        { key: 'aiInstructions', type: 'string', size: 1000, required: false },
        { key: 'primaryGenre', type: 'string', size: 100, required: false },
        { key: 'lyrics', type: 'string', size: 10000, required: false },
        { key: 'status', type: 'string', size: 50, required: true, default: 'draft' },
        { key: 'lyricsGeneratedAt', type: 'datetime', required: false },
        { key: 'generationError', type: 'string', size: 1000, required: false },
        // Audio fields
        { key: 'audioStatus', type: 'string', size: 50, required: false },
        { key: 'murekaTaskId', type: 'string', size: 100, required: false },
        { key: 'audioUrl', type: 'string', size: 500, required: false },
        { key: 'audioDuration', type: 'integer', required: false },
        { key: 'audioGenerationStartedAt', type: 'datetime', required: false },
        { key: 'audioCompletedAt', type: 'datetime', required: false },
        { key: 'audioError', type: 'string', size: 1000, required: false },
        { key: 'lastStatusCheck', type: 'datetime', required: false },
        { key: 'checkAttempts', type: 'integer', required: false, default: 0 },
        { key: 'totalCheckAttempts', type: 'integer', required: false }
      ],
      indexes: [
        {
          key: 'status_index',
          type: 'key',
          attributes: ['status'],
          orders: ['ASC']
        },
        {
          key: 'audio_status_index',
          type: 'key',
          attributes: ['audioStatus'],
          orders: ['ASC']
        }
      ]
    }
  }
};

export const FUNCTION_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000
};
