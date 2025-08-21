/**
 * Single source of truth for Appwrite database schema
 * This file defines all collections, attributes, and relationships
 */

export const DATABASE_ID = 'mitchly-music-db';
export const STORAGE_BUCKET = 'mitchly-music';

// Collection IDs
export const COLLECTIONS = {
  BANDS: 'bands',
  ALBUMS: 'albums',
  SONGS: 'songs'
};

// Band Status Types
export const BAND_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  PUBLISHED: 'published',
  FAILED: 'failed'
};

// Album Status Types
export const ALBUM_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Song Status Types
export const SONG_STATUS = {
  PENDING: 'pending',
  GENERATING_LYRICS: 'generating_lyrics',
  LYRICS_COMPLETED: 'lyrics_completed',
  GENERATING_AUDIO: 'generating_audio',
  PROCESSING_AUDIO: 'processing_audio',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Schema Definitions
export const SCHEMA = {
  // Bands Collection
  bands: {
    collectionId: COLLECTIONS.BANDS,
    name: 'Bands',
    attributes: [
      { key: 'bandName', type: 'string', size: 255, required: true },
      { key: 'primaryGenre', type: 'string', size: 100, required: true },
      { key: 'status', type: 'enum', elements: Object.values(BAND_STATUS), required: true, default: BAND_STATUS.DRAFT },
      { key: 'userId', type: 'string', size: 36, required: false }, // Optional for anonymous
      { key: 'userPrompt', type: 'string', size: 5000, required: true }, // Original user input
      { key: 'aiInstructions', type: 'string', size: 5000, required: false }, // AI generation context
      { key: 'profileData', type: 'string', size: 10000, required: true }, // JSON string
      { key: 'origin', type: 'string', size: 255, required: false },
      { key: 'formationYear', type: 'integer', required: false },
      // Visual Assets
      { key: 'logoUrl', type: 'url', required: false },
      { key: 'logoPrompt', type: 'string', size: 1000, required: false },
      { key: 'bandPhotoUrl', type: 'url', required: false },
      { key: 'bandPhotoPrompt', type: 'string', size: 1000, required: false },
      // Timestamps
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
      { key: 'publishedAt', type: 'datetime', required: false },
      // Error tracking
      { key: 'generationError', type: 'string', size: 1000, required: false }
    ],
    indexes: [
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'userId_idx', type: 'key', attributes: ['userId'] },
      { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] },
      { key: 'publishedAt_idx', type: 'key', attributes: ['publishedAt'] }
    ]
  },

  // Albums Collection
  albums: {
    collectionId: COLLECTIONS.ALBUMS,
    name: 'Albums',
    attributes: [
      { key: 'bandId', type: 'string', size: 36, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'status', type: 'enum', elements: Object.values(ALBUM_STATUS), required: true, default: ALBUM_STATUS.DRAFT },
      { key: 'userPrompt', type: 'string', size: 5000, required: false }, // Optional album-specific prompt
      { key: 'aiInstructions', type: 'string', size: 5000, required: false }, // Album AI context
      { key: 'trackCount', type: 'integer', required: true, default: 8 },
      { key: 'releaseYear', type: 'integer', required: false },
      { key: 'conceptData', type: 'string', size: 10000, required: false }, // JSON string
      // Visual Assets
      { key: 'coverUrl', type: 'url', required: false },
      { key: 'coverPrompt', type: 'string', size: 1000, required: false },
      { key: 'backCoverUrl', type: 'url', required: false },
      // Timestamps
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
      // Error tracking
      { key: 'generationError', type: 'string', size: 1000, required: false }
    ],
    indexes: [
      { key: 'bandId_idx', type: 'key', attributes: ['bandId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'createdAt_idx', type: 'key', attributes: ['createdAt'] }
    ]
  },

  // Songs Collection
  songs: {
    collectionId: COLLECTIONS.SONGS,
    name: 'Songs',
    attributes: [
      { key: 'bandId', type: 'string', size: 36, required: true },
      { key: 'albumId', type: 'string', size: 36, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'trackNumber', type: 'integer', required: true },
      { key: 'status', type: 'enum', elements: Object.values(SONG_STATUS), required: true, default: SONG_STATUS.PENDING },
      { key: 'aiInstructions', type: 'string', size: 5000, required: false }, // Song-specific AI context
      { key: 'description', type: 'string', size: 1000, required: false },
      // Lyrics
      { key: 'lyrics', type: 'string', size: 10000, required: false },
      { key: 'lyricsStatus', type: 'enum', elements: Object.values(SONG_STATUS), required: false },
      // Audio
      { key: 'audioUrl', type: 'url', required: false },
      { key: 'audioStatus', type: 'enum', elements: Object.values(SONG_STATUS), required: false },
      { key: 'murekaTaskId', type: 'string', size: 255, required: false },
      { key: 'duration', type: 'integer', required: false }, // In seconds
      // Timestamps
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
      { key: 'lyricsGeneratedAt', type: 'datetime', required: false },
      { key: 'audioGeneratedAt', type: 'datetime', required: false },
      // Error tracking
      { key: 'lyricsError', type: 'string', size: 1000, required: false },
      { key: 'audioError', type: 'string', size: 1000, required: false }
    ],
    indexes: [
      { key: 'bandId_idx', type: 'key', attributes: ['bandId'] },
      { key: 'albumId_idx', type: 'key', attributes: ['albumId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'trackNumber_idx', type: 'key', attributes: ['trackNumber'] },
      { key: 'bandAlbum_idx', type: 'key', attributes: ['bandId', 'albumId'] }
    ]
  }
};

// Function Event Names
export const EVENTS = {
  // Band Events
  BAND_CREATED: 'band.created',
  BAND_STATUS_CHANGED: 'band.status.changed',
  
  // Album Events  
  ALBUM_CREATED: 'album.created',
  ALBUM_STATUS_CHANGED: 'album.status.changed',
  
  // Song Events
  SONG_CREATED: 'song.created',
  SONG_STATUS_CHANGED: 'song.status.changed',
  SONG_LYRICS_REQUESTED: 'song.lyrics.requested',
  SONG_AUDIO_REQUESTED: 'song.audio.requested'
};

// Helper function to get collection attributes for API calls
export function getCollectionAttributes(collectionName) {
  return SCHEMA[collectionName]?.attributes || [];
}

// Helper function to get collection indexes for API calls
export function getCollectionIndexes(collectionName) {
  return SCHEMA[collectionName]?.indexes || [];
}
