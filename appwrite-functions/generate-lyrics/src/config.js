export const DATABASE_CONFIG = {
  DATABASE_ID: 'mitchly-music-db',
  DATABASE_NAME: 'Mitchly Music Database',
  COLLECTIONS: [
    {
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
    {
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
        { key: 'generationError', type: 'string', size: 1000, required: false }
      ]
    }
  ]
};
