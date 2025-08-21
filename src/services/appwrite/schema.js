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
      { key: 'bandName', type: 'string', size: 255, required: false }, // Not required for draft creation
      { key: 'primaryGenre', type: 'string', size: 255, required: false }, // Not required for draft creation
      { key: 'status', type: 'enum', elements: Object.values(BAND_STATUS), required: false, default: BAND_STATUS.DRAFT },
      { key: 'userId', type: 'string', size: 36, required: false }, // Optional for anonymous
      { key: 'userPrompt', type: 'string', size: 5000, required: false }, // Original user input
      { key: 'aiInstructions', type: 'string', size: 5000, required: false }, // AI generation context
      { key: 'profileData', type: 'string', size: 65535, required: false }, // JSON string - actual size in Appwrite
      { key: 'origin', type: 'string', size: 100, required: false },
      { key: 'formationYear', type: 'integer', required: false },
      // Visual Assets
      { key: 'logoUrl', type: 'string', size: 500, required: false },
      { key: 'logoPrompt', type: 'string', size: 1000, required: false },
      { key: 'bandPhotoUrl', type: 'string', size: 500, required: false },
      { key: 'bandPhotoPrompt', type: 'string', size: 1000, required: false }, // Missing in Appwrite
      // Legacy fields (still in Appwrite)
      { key: 'imageUrl', type: 'string', size: 500, required: false },
      { key: 'albumTitle', type: 'string', size: 255, required: false },
      { key: 'albumDescription', type: 'string', size: 1000, required: false },
      { key: 'trackCount', type: 'integer', required: false, default: 0 },
      { key: 'albumCoverUrl', type: 'string', size: 500, required: false },
      { key: 'createdBy', type: 'string', size: 50, required: false },
      // Timestamps (Appwrite auto-generates $createdAt and $updatedAt)
      { key: 'publishedAt', type: 'datetime', required: false }, // Missing in Appwrite
      // Error tracking
      { key: 'generationError', type: 'string', size: 1000, required: false } // Missing in Appwrite
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
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'concept', type: 'string', size: 2000, required: false }, // Exists in Appwrite
      { key: 'status', type: 'enum', elements: Object.values(ALBUM_STATUS), required: false, default: ALBUM_STATUS.DRAFT },
      { key: 'userPrompt', type: 'string', size: 5000, required: false }, // Optional album-specific prompt
      { key: 'aiInstructions', type: 'string', size: 5000, required: false }, // Album AI context
      { key: 'trackCount', type: 'integer', required: false, default: 8 },
      { key: 'releaseYear', type: 'integer', required: false }, // Added to Appwrite
      { key: 'conceptData', type: 'string', size: 20000, required: false }, // Added with size > 16384 to bypass limit
      // Visual Assets
      { key: 'coverUrl', type: 'url', required: false },
      { key: 'coverPrompt', type: 'string', size: 16384, required: false }, // Added with size >= 16384 to bypass limit
      { key: 'backCoverUrl', type: 'url', required: false }, // Missing in Appwrite
      // Timestamps (Appwrite auto-generates $createdAt and $updatedAt)
      // Error tracking
      { key: 'generationError', type: 'string', size: 1000, required: false } // Missing in Appwrite
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
      { key: 'albumId', type: 'string', size: 36, required: false }, // Not required in Appwrite
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'trackNumber', type: 'integer', required: true },
      { key: 'status', type: 'string', size: 50, required: false, default: 'pending' }, // Plain string in Appwrite
      { key: 'aiInstructions', type: 'string', size: 16384, required: false }, // Added with size >= 16384 to bypass limit
      { key: 'description', type: 'string', size: 500, required: false },
      // Lyrics
      { key: 'lyrics', type: 'string', size: 10000, required: true }, // Required in Appwrite
      { key: 'lyricsStatus', type: 'string', size: 50, required: false }, // Missing in Appwrite
      { key: 'lyricsError', type: 'string', size: 1000, required: false }, // Missing in Appwrite
      { key: 'lyricsGeneratedAt', type: 'datetime', required: false }, // Missing in Appwrite
      // Audio
      { key: 'audioUrl', type: 'string', size: 500, required: false },
      { key: 'audioStatus', type: 'string', size: 50, required: false },
      { key: 'murekaTaskId', type: 'string', size: 100, required: false },
      { key: 'artistDescription', type: 'string', size: 500, required: false }, // Exists in Appwrite
      { key: 'audioError', type: 'string', size: 500, required: false },
      { key: 'audioGeneratedAt', type: 'datetime', required: false },
      { key: 'audioCompletedAt', type: 'datetime', required: false }, // Exists in Appwrite
      { key: 'audioFlacUrl', type: 'url', required: false }, // Exists in Appwrite
      { key: 'audioDuration', type: 'double', required: false }, // Double in Appwrite
      // Additional fields in Appwrite
      { key: 'lastStatusCheck', type: 'string', size: 255, required: false },
      { key: 'checkAttempts', type: 'integer', required: false, default: 0 },
      { key: 'totalCheckAttempts', type: 'integer', required: false },
      // Timestamps (Appwrite auto-generates $createdAt and $updatedAt)
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
