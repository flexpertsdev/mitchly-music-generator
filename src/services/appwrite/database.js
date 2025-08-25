/**
 * Appwrite Database Service
 * Handles all database operations for bands, albums, and songs
 */
import { Client, Databases, ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS, BAND_STATUS, ALBUM_STATUS, SONG_STATUS } from './schema.js';

// Initialize client locally to avoid circular dependency
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'flexos');

// Initialize database service
const databases = new Databases(client);

// Service status (shared with other services)
export const serviceStatus = {
  isAvailable: true,
  lastCheck: 0,
  checkInterval: 30000
};

// Check service availability
async function checkServiceAvailability() {
  const now = Date.now();
  if (now - serviceStatus.lastCheck < serviceStatus.checkInterval) {
    return serviceStatus.isAvailable;
  }
  
  try {
    await databases.listDocuments(DATABASE_ID, COLLECTIONS.BANDS, [Query.limit(1)]);
    serviceStatus.isAvailable = true;
  } catch (error) {
    console.warn('Appwrite database is not available:', error.message);
    serviceStatus.isAvailable = false;
  }
  
  serviceStatus.lastCheck = now;
  return serviceStatus.isAvailable;
}

// Band Service
export const bandService = {
  async create(data) {
    try {
      await checkServiceAvailability();
      
      const bandData = {
        bandName: data.bandName,
        primaryGenre: data.primaryGenre,
        status: data.status || BAND_STATUS.DRAFT,
        userId: data.userId || null,
        userPrompt: data.userPrompt || '',
        aiInstructions: data.aiInstructions || null,
        profileData: JSON.stringify(data.profileData || data),
        origin: data.origin || null,
        formationYear: data.formationYear || null,
        // Visual assets
        logoUrl: data.logoUrl || null,
        logoPrompt: data.logoPrompt || null,
        bandPhotoUrl: data.bandPhotoUrl || null,
        bandPhotoPrompt: data.bandPhotoPrompt || null,
        // Legacy fields from existing schema
        albumTitle: data.albumTitle || '',
        albumDescription: data.albumDescription || '',
        trackCount: data.trackCount || 8,
        albumCoverUrl: data.albumCoverUrl || null,
        createdBy: data.createdBy || 'anonymous'
      };
      
      if (!serviceStatus.isAvailable) {
        throw new Error('Database service unavailable');
      }
      
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.BANDS,
        ID.unique(),
        bandData
      );
      
      return {
        ...document,
        profileData: JSON.parse(document.profileData)
      };
    } catch (error) {
      console.error('Error creating band:', error);
      throw error;
    }
  },

  async get(bandId) {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.BANDS,
        bandId
      );
      
      return {
        ...document,
        profileData: document.profileData ? JSON.parse(document.profileData) : {}
      };
    } catch (error) {
      console.error('Error fetching band:', error);
      throw error;
    }
  },

  async list(options = {}) {
    const { limit = 10, offset = 0, status = null } = options;
    
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];
      
      if (status) {
        queries.push(Query.equal('status', status));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BANDS,
        queries
      );
      
      return {
        ...response,
        documents: response.documents.map(doc => ({
          ...doc,
          profileData: doc.profileData ? JSON.parse(doc.profileData) : {}
        }))
      };
    } catch (error) {
      console.error('Error listing bands:', error);
      throw error;
    }
  },

  async update(bandId, updates) {
    try {
      const updateData = { ...updates };
      
      // Convert profileData to JSON string if provided
      if (updates.profileData && typeof updates.profileData === 'object') {
        updateData.profileData = JSON.stringify(updates.profileData);
      }
      
      const document = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.BANDS,
        bandId,
        updateData
      );
      
      return {
        ...document,
        profileData: document.profileData ? JSON.parse(document.profileData) : {}
      };
    } catch (error) {
      console.error('Error updating band:', error);
      throw error;
    }
  },

  async delete(bandId) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.BANDS, bandId);
    } catch (error) {
      console.error('Error deleting band:', error);
      throw error;
    }
  }
};

// Album Service
export const albumService = {
  async create(data) {
    try {
      await checkServiceAvailability();
      
      const albumData = {
        bandId: data.bandId,
        title: data.title,
        description: data.description || null,
        status: data.status || ALBUM_STATUS.DRAFT,
        userPrompt: data.userPrompt || null,
        aiInstructions: data.aiInstructions || null,
        trackCount: data.trackCount || 8,
        concept: data.concept || null,
        coverUrl: data.coverUrl || null,
        coverPrompt: data.coverPrompt || null
      };
      
      if (!serviceStatus.isAvailable) {
        throw new Error('Database service unavailable');
      }
      
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ALBUMS,
        ID.unique(),
        albumData
      );
      
      return document;
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  },

  async get(albumId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ALBUMS,
        albumId
      );
    } catch (error) {
      console.error('Error fetching album:', error);
      throw error;
    }
  },

  async getByBandId(bandId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALBUMS,
        [
          Query.equal('bandId', bandId),
          Query.orderDesc('$createdAt')
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching albums by band:', error);
      throw error;
    }
  },

  async update(albumId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ALBUMS,
        albumId,
        updates
      );
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  },

  async delete(albumId) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ALBUMS, albumId);
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  }
};

// Song Service
export const songService = {
  async create(data) {
    try {
      await checkServiceAvailability();
      
      const songData = {
        bandId: data.bandId,
        albumId: data.albumId || null,
        title: data.title,
        trackNumber: data.trackNumber,
        status: data.status || SONG_STATUS.PENDING,
        aiInstructions: data.aiInstructions || null,
        description: data.description || null,
        lyrics: data.lyrics || '',
        audioUrl: data.audioUrl || null,
        audioStatus: data.audioStatus || null,
        murekaTaskId: data.murekaTaskId || null,
        audioError: data.audioError || null,
        artistDescription: data.artistDescription || '',
        audioDuration: data.audioDuration || null,
        audioFlacUrl: data.audioFlacUrl || null,
        audioGeneratedAt: data.audioGeneratedAt || null,
        audioCompletedAt: data.audioCompletedAt || null
      };
      
      if (!serviceStatus.isAvailable) {
        throw new Error('Database service unavailable');
      }
      
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        ID.unique(),
        songData
      );
      
      return document;
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    }
  },

  async get(songId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        songId
      );
    } catch (error) {
      console.error('Error fetching song:', error);
      throw error;
    }
  },

  async getByBandId(bandId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        [
          Query.equal('bandId', bandId),
          Query.orderAsc('trackNumber')
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching songs by band:', error);
      throw error;
    }
  },

  async getByAlbumId(albumId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        [
          Query.equal('albumId', albumId),
          Query.orderAsc('trackNumber')
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching songs by album:', error);
      throw error;
    }
  },

  async update(songId, updates) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        songId,
        updates
      );
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  },

  async delete(songId) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SONGS, songId);
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  },

  async list(options = {}) {
    const { limit = 200, offset = 0, status = null } = options;
    
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];
      
      if (status) {
        queries.push(Query.equal('status', status));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SONGS,
        queries
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error listing songs:', error);
      throw error;
    }
  }
};

// Playlist Service
export const playlistService = {
  async create(userId, name, type = 'custom', description = '') {
    try {
      await checkServiceAvailability();
      
      const playlistData = {
        userId,
        name,
        type,
        description,
        isPrivate: true,
        isPublished: false,
        coverUrl: null
      };
      
      if (!serviceStatus.isAvailable) {
        throw new Error('Database service unavailable');
      }
      
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PLAYLISTS,
        ID.unique(),
        playlistData
      );
      
      return document;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  async getPlaylists(userId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLISTS,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  },

  async getFavoritesPlaylist(userId) {
    try {
      // Check if favorites playlist exists
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLISTS,
        [
          Query.equal('userId', userId),
          Query.equal('type', 'favorites'),
          Query.limit(1)
        ]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0];
      }
      
      // Create favorites playlist if it doesn't exist
      return await this.create(userId, 'My Favorites', 'favorites', 'Your favorite bands, albums, and tracks');
    } catch (error) {
      console.error('Error getting favorites playlist:', error);
      throw error;
    }
  },

  async addToPlaylist(playlistId, itemType, itemId, userId) {
    try {
      // Check if item already exists in playlist
      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        [
          Query.equal('playlistId', playlistId),
          Query.equal('itemId', itemId),
          Query.limit(1)
        ]
      );
      
      if (existing.documents.length > 0) {
        return existing.documents[0]; // Item already in playlist
      }
      
      // Get max position in playlist
      const items = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        [
          Query.equal('playlistId', playlistId),
          Query.orderDesc('position'),
          Query.limit(1)
        ]
      );
      
      const position = items.documents.length > 0 ? items.documents[0].position + 1 : 0;
      
      const playlistItemData = {
        playlistId,
        itemType,
        itemId,
        position,
        userId,
        addedAt: new Date().toISOString()
      };
      
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        ID.unique(),
        playlistItemData
      );
      
      return document;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      throw error;
    }
  },

  async removeFromPlaylist(playlistId, itemId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        [
          Query.equal('playlistId', playlistId),
          Query.equal('itemId', itemId),
          Query.limit(1)
        ]
      );
      
      if (response.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.PLAYLIST_ITEMS,
          response.documents[0].$id
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error removing from playlist:', error);
      throw error;
    }
  },

  async getPlaylistItems(playlistId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        [
          Query.equal('playlistId', playlistId),
          Query.orderAsc('position'),
          Query.limit(500)
        ]
      );
      
      // Group items by type for efficient fetching
      const itemsByType = {
        band: [],
        album: [],
        song: []
      };
      
      response.documents.forEach(item => {
        itemsByType[item.itemType].push(item);
      });
      
      // Fetch related data for each type
      const populatedItems = [];
      
      // Fetch bands
      if (itemsByType.band.length > 0) {
        const bandIds = itemsByType.band.map(item => item.itemId);
        const bands = await Promise.all(
          bandIds.map(id => bandService.get(id).catch(() => null))
        );
        
        itemsByType.band.forEach((item, index) => {
          if (bands[index]) {
            populatedItems.push({
              ...item,
              data: bands[index]
            });
          }
        });
      }
      
      // Fetch albums
      if (itemsByType.album.length > 0) {
        const albumIds = itemsByType.album.map(item => item.itemId);
        const albums = await Promise.all(
          albumIds.map(id => albumService.get(id).catch(() => null))
        );
        
        itemsByType.album.forEach((item, index) => {
          if (albums[index]) {
            populatedItems.push({
              ...item,
              data: albums[index]
            });
          }
        });
      }
      
      // Fetch songs
      if (itemsByType.song.length > 0) {
        const songIds = itemsByType.song.map(item => item.itemId);
        const songs = await Promise.all(
          songIds.map(id => songService.get(id).catch(() => null))
        );
        
        itemsByType.song.forEach((item, index) => {
          if (songs[index]) {
            populatedItems.push({
              ...item,
              data: songs[index]
            });
          }
        });
      }
      
      // Sort by position
      populatedItems.sort((a, b) => a.position - b.position);
      
      return populatedItems;
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      throw error;
    }
  },

  async reorderPlaylistItems(playlistId, itemIds) {
    try {
      // Update positions for all items
      const updates = itemIds.map((itemId, index) => 
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PLAYLIST_ITEMS,
          [
            Query.equal('playlistId', playlistId),
            Query.equal('itemId', itemId),
            Query.limit(1)
          ]
        ).then(response => {
          if (response.documents.length > 0) {
            return databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.PLAYLIST_ITEMS,
              response.documents[0].$id,
              { position: index }
            );
          }
        })
      );
      
      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error reordering playlist items:', error);
      throw error;
    }
  },

  async isItemInPlaylist(playlistId, itemId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYLIST_ITEMS,
        [
          Query.equal('playlistId', playlistId),
          Query.equal('itemId', itemId),
          Query.limit(1)
        ]
      );
      
      return response.documents.length > 0;
    } catch (error) {
      console.error('Error checking playlist item:', error);
      return false;
    }
  }
};

// Export service status checker
export const getDatabaseStatus = () => ({
  isAvailable: serviceStatus.isAvailable,
  mode: serviceStatus.isAvailable ? 'online' : 'offline'
});
