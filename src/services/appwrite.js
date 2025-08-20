import { Client, Databases, Storage, ID, Query } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6761a31600224c0e82df');

// Note: In browser environments, we typically use session-based auth
// API keys should only be used in server-side environments
// For now, we'll use anonymous access or session-based auth

// Initialize services
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const SONGS_COLLECTION = 'songs';
const STORAGE_BUCKET = 'mitchly-music'; // Consolidated bucket

// Error handling state
let isAppwriteAvailable = true;
let lastAppwriteCheck = 0;
const APPWRITE_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Check if Appwrite is available
async function checkAppwriteAvailability() {
  const now = Date.now();
  if (now - lastAppwriteCheck < APPWRITE_CHECK_INTERVAL) {
    return isAppwriteAvailable;
  }
  
  try {
    // Try a simple operation to check connectivity
    await databases.listDocuments(DATABASE_ID, BANDS_COLLECTION, [Query.limit(1)]);
    isAppwriteAvailable = true;
  } catch (error) {
    console.warn('Appwrite is not available:', error.message);
    isAppwriteAvailable = false;
  }
  
  lastAppwriteCheck = now;
  return isAppwriteAvailable;
}

// Fallback localStorage operations
const localStorageFallback = {
  bands: {
    get(key) {
      const bands = JSON.parse(localStorage.getItem('mitchly_bands') || '[]');
      return bands.find(b => b.$id === key);
    },
    list(limit = 10) {
      const bands = JSON.parse(localStorage.getItem('mitchly_bands') || '[]');
      return bands.slice(0, limit).sort((a, b) => 
        new Date(b.$createdAt) - new Date(a.$createdAt)
      );
    },
    create(data) {
      const bands = JSON.parse(localStorage.getItem('mitchly_bands') || '[]');
      const newBand = {
        ...data,
        $id: `local_${ID.unique()}`,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        _isLocal: true
      };
      bands.unshift(newBand);
      localStorage.setItem('mitchly_bands', JSON.stringify(bands));
      return newBand;
    },
    update(id, updates) {
      const bands = JSON.parse(localStorage.getItem('mitchly_bands') || '[]');
      const index = bands.findIndex(b => b.$id === id);
      if (index >= 0) {
        bands[index] = { ...bands[index], ...updates, $updatedAt: new Date().toISOString() };
        localStorage.setItem('mitchly_bands', JSON.stringify(bands));
        return bands[index];
      }
      throw new Error('Band not found');
    },
    delete(id) {
      const bands = JSON.parse(localStorage.getItem('mitchly_bands') || '[]');
      const filtered = bands.filter(b => b.$id !== id);
      localStorage.setItem('mitchly_bands', JSON.stringify(filtered));
    }
  },
  songs: {
    list(bandId) {
      const songs = JSON.parse(localStorage.getItem('mitchly_songs') || '[]');
      return songs.filter(s => s.bandId === bandId).sort((a, b) => a.trackNumber - b.trackNumber);
    },
    create(data) {
      const songs = JSON.parse(localStorage.getItem('mitchly_songs') || '[]');
      const newSong = {
        ...data,
        $id: `local_${ID.unique()}`,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        _isLocal: true
      };
      songs.push(newSong);
      localStorage.setItem('mitchly_songs', JSON.stringify(songs));
      return newSong;
    },
    update(id, updates) {
      const songs = JSON.parse(localStorage.getItem('mitchly_songs') || '[]');
      const index = songs.findIndex(s => s.$id === id);
      if (index >= 0) {
        songs[index] = { ...songs[index], ...updates, $updatedAt: new Date().toISOString() };
        localStorage.setItem('mitchly_songs', JSON.stringify(songs));
        return songs[index];
      }
      throw new Error('Song not found');
    },
    delete(id) {
      const songs = JSON.parse(localStorage.getItem('mitchly_songs') || '[]');
      const filtered = songs.filter(s => s.$id !== id);
      localStorage.setItem('mitchly_songs', JSON.stringify(filtered));
    },
    listAll(limit = 200) {
      const songs = JSON.parse(localStorage.getItem('mitchly_songs') || '[]');
      return songs.slice(0, limit);
    }
  }
};

// Band operations with error handling
export const bandService = {
  async create(bandProfile) {
    try {
      // Check if Appwrite is available
      await checkAppwriteAvailability();
      
      const bandData = {
        bandName: bandProfile.bandName,
        primaryGenre: bandProfile.primaryGenre,
        profileData: JSON.stringify(bandProfile),
        albumTitle: bandProfile.albumConcept?.title || '',
        albumDescription: bandProfile.albumConcept?.description || '',
        trackCount: bandProfile.trackListing?.length || 0,
        formationYear: bandProfile.formationYear || '',
        origin: bandProfile.origin || '',
        // Media URLs - will be updated when images/audio are generated
        logoUrl: bandProfile.logoUrl || '',
        albumCoverUrl: bandProfile.albumCoverUrl || '',
        bandPhotoUrl: bandProfile.bandPhotoUrl || '',
        imageUrl: bandProfile.imageUrl || null
      };
      
      if (isAppwriteAvailable) {
        const document = await databases.createDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          ID.unique(),
          bandData
        );
        
        // Automatically create placeholder song documents for each track
        if (bandProfile.trackListing && bandProfile.trackListing.length > 0) {
          console.log('Creating song placeholders for', bandProfile.trackListing.length, 'tracks');
          for (let i = 0; i < bandProfile.trackListing.length; i++) {
            try {
              await songService.create({
                bandId: document.$id,
                title: bandProfile.trackListing[i],
                trackNumber: i + 1,
                lyrics: '',
                description: '',
                artistDescription: bandProfile.aiDescription || '',
                status: 'pending',
                audioUrl: ''
              });
            } catch (songError) {
              console.error('Error creating song placeholder:', songError);
            }
          }
        }
        
        return document;
      } else {
        // Use localStorage fallback
        console.info('Using localStorage fallback for band creation');
        const localBand = localStorageFallback.bands.create(bandData);
        return localBand;
      }
    } catch (error) {
      // If Appwrite fails, try localStorage
      if (error.code === 'ECONNREFUSED' || error.message?.includes('CORS') || error.code === 401) {
        console.warn('Appwrite unavailable, using localStorage:', error.message);
        isAppwriteAvailable = false;
        const localBand = localStorageFallback.bands.create({
          bandName: bandProfile.bandName,
          primaryGenre: bandProfile.primaryGenre,
          profileData: JSON.stringify(bandProfile),
          albumTitle: bandProfile.albumConcept?.title || '',
          albumDescription: bandProfile.albumConcept?.description || '',
          trackCount: bandProfile.trackListing?.length || 0,
          imageUrl: bandProfile.imageUrl || null,
          logoUrl: bandProfile.logoUrl || null
        });
        return localBand;
      }
      throw error;
    }
  },

  async get(bandId) {
    try {
      // Check localStorage first for local bands
      if (bandId.startsWith('local_')) {
        const localBand = localStorageFallback.bands.get(bandId);
        if (localBand) {
          return {
            ...localBand,
            profileData: typeof localBand.profileData === 'string' 
              ? JSON.parse(localBand.profileData) 
              : localBand.profileData
          };
        }
        throw new Error('Band not found in local storage');
      }
      
      if (isAppwriteAvailable) {
        const document = await databases.getDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          bandId
        );
        return {
          ...document,
          profileData: typeof document.profileData === 'string'
            ? JSON.parse(document.profileData)
            : document.profileData
        };
      } else {
        const localBand = localStorageFallback.bands.get(bandId);
        if (localBand) {
          return {
            ...localBand,
            profileData: typeof localBand.profileData === 'string'
              ? JSON.parse(localBand.profileData)
              : localBand.profileData
          };
        }
        throw new Error('Band not found');
      }
    } catch (error) {
      // Try localStorage fallback
      const localBand = localStorageFallback.bands.get(bandId);
      if (localBand) {
        return {
          ...localBand,
          profileData: typeof localBand.profileData === 'string'
            ? JSON.parse(localBand.profileData)
            : localBand.profileData
        };
      }
      throw error;
    }
  },

  async list(limit = 10) {
    try {
      await checkAppwriteAvailability();
      
      if (isAppwriteAvailable) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          BANDS_COLLECTION,
          [
            Query.limit(limit),
            Query.orderDesc('$createdAt')
          ]
        );
        const remoteBands = response.documents.map(doc => ({
          ...doc,
          profileData: JSON.parse(doc.profileData)
        }));
        
        // Merge with local bands
        const localBands = localStorageFallback.bands.list(limit);
        const mergedBands = [...localBands, ...remoteBands];
        
        // Remove duplicates and limit
        const uniqueBands = Array.from(new Map(mergedBands.map(b => [b.$id, b])).values());
        return uniqueBands.slice(0, limit);
      } else {
        // Use only localStorage
        const localBands = localStorageFallback.bands.list(limit);
        return localBands.map(b => ({
          ...b,
          profileData: typeof b.profileData === 'string' ? JSON.parse(b.profileData) : b.profileData
        }));
      }
    } catch (error) {
      console.warn('Using localStorage fallback for band list:', error.message);
      isAppwriteAvailable = false;
      const localBands = localStorageFallback.bands.list(limit);
      return localBands.map(b => ({
        ...b,
        profileData: typeof b.profileData === 'string' ? JSON.parse(b.profileData) : b.profileData
      }));
    }
  },

  async update(bandId, updates) {
    try {
      if (bandId.startsWith('local_')) {
        return localStorageFallback.bands.update(bandId, updates);
      }
      
      if (isAppwriteAvailable) {
        const updateData = {};
        if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
        if (updates.logoUrl !== undefined) updateData.logoUrl = updates.logoUrl;
        if (updates.profileData) updateData.profileData = JSON.stringify(updates.profileData);

        const document = await databases.updateDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          bandId,
          updateData
        );
        return document;
      } else {
        return localStorageFallback.bands.update(bandId, updates);
      }
    } catch (error) {
      if (bandId.startsWith('local_')) {
        return localStorageFallback.bands.update(bandId, updates);
      }
      throw error;
    }
  },

  async delete(bandId) {
    try {
      if (bandId.startsWith('local_')) {
        return localStorageFallback.bands.delete(bandId);
      }
      
      if (isAppwriteAvailable) {
        await databases.deleteDocument(DATABASE_ID, BANDS_COLLECTION, bandId);
      } else {
        localStorageFallback.bands.delete(bandId);
      }
    } catch (error) {
      if (bandId.startsWith('local_')) {
        localStorageFallback.bands.delete(bandId);
        return;
      }
      throw error;
    }
  }
};

// Song operations with error handling
export const songService = {
  async create(song) {
    try {
      await checkAppwriteAvailability();
      
      if (isAppwriteAvailable) {
        const document = await databases.createDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          ID.unique(),
          {
            bandId: song.bandId,
            title: song.title,
            trackNumber: song.trackNumber,
            lyrics: song.lyrics,
            description: song.description || null,
            audioUrl: song.audioUrl || null,
            murekaTaskId: song.murekaTaskId || null,
            status: song.status || 'pending'
          }
        );
        return document;
      } else {
        console.info('Using localStorage fallback for song creation');
        return localStorageFallback.songs.create(song);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('CORS') || error.code === 401) {
        console.warn('Appwrite unavailable, using localStorage for song:', error.message);
        isAppwriteAvailable = false;
        return localStorageFallback.songs.create(song);
      }
      throw error;
    }
  },

  async update(songId, updates) {
    try {
      if (songId.startsWith('local_')) {
        return localStorageFallback.songs.update(songId, updates);
      }
      
      if (isAppwriteAvailable) {
        const document = await databases.updateDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          songId,
          updates
        );
        return document;
      } else {
        return localStorageFallback.songs.update(songId, updates);
      }
    } catch (error) {
      if (songId.startsWith('local_')) {
        return localStorageFallback.songs.update(songId, updates);
      }
      console.warn('Song update failed, trying localStorage:', error.message);
      return localStorageFallback.songs.update(songId, updates);
    }
  },

  async getByBandId(bandId) {
    try {
      // Check for local band songs first
      if (bandId.startsWith('local_')) {
        return localStorageFallback.songs.list(bandId);
      }
      
      if (isAppwriteAvailable) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          SONGS_COLLECTION,
          [
            Query.equal('bandId', bandId),
            Query.orderAsc('trackNumber')
          ]
        );
        
        // Merge with local songs for this band
        const localSongs = localStorageFallback.songs.list(bandId);
        const allSongs = [...localSongs, ...response.documents];
        
        // Remove duplicates
        const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.$id, s])).values());
        return uniqueSongs.sort((a, b) => a.trackNumber - b.trackNumber);
      } else {
        return localStorageFallback.songs.list(bandId);
      }
    } catch (error) {
      console.warn('Using localStorage fallback for songs:', error.message);
      return localStorageFallback.songs.list(bandId);
    }
  },

  async list(limit = 200) {
    try {
      await checkAppwriteAvailability();
      
      if (isAppwriteAvailable) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          SONGS_COLLECTION,
          [Query.limit(limit)]
        );
        
        // Merge with local songs
        const localSongs = localStorageFallback.songs.listAll(limit);
        const allSongs = [...localSongs, ...response.documents];
        
        // Remove duplicates and limit
        const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.$id, s])).values());
        return uniqueSongs.slice(0, limit);
      } else {
        return localStorageFallback.songs.listAll(limit);
      }
    } catch (error) {
      console.warn('Using localStorage fallback for song list:', error.message);
      return localStorageFallback.songs.listAll(limit);
    }
  },

  async delete(songId) {
    try {
      if (songId.startsWith('local_')) {
        return localStorageFallback.songs.delete(songId);
      }
      
      if (isAppwriteAvailable) {
        await databases.deleteDocument(DATABASE_ID, SONGS_COLLECTION, songId);
      } else {
        localStorageFallback.songs.delete(songId);
      }
    } catch (error) {
      if (songId.startsWith('local_')) {
        localStorageFallback.songs.delete(songId);
        return;
      }
      throw error;
    }
  }
};

// Storage operations with consolidated bucket
export const storageService = {
  async uploadImage(file) {
    try {
      if (!isAppwriteAvailable) {
        console.warn('Storage not available in offline mode');
        // Return a placeholder or data URL for local storage
        return URL.createObjectURL(file);
      }
      
      const response = await storage.createFile(
        STORAGE_BUCKET, // Use consolidated bucket
        ID.unique(),
        file
      );
      // Get the file URL for viewing
      const fileUrl = storage.getFileView(STORAGE_BUCKET, response.$id);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // If bucket doesn't exist, provide helpful error
      if (error.code === 404) {
        throw new Error(`Storage bucket "${STORAGE_BUCKET}" not found. Please create it in Appwrite console.`);
      }
      // Fallback to local object URL
      if (file instanceof File || file instanceof Blob) {
        return URL.createObjectURL(file);
      }
      throw error;
    }
  },

  async uploadAudio(file) {
    try {
      if (!isAppwriteAvailable) {
        console.warn('Storage not available in offline mode');
        // Return a placeholder or data URL for local storage
        return URL.createObjectURL(file);
      }
      
      const response = await storage.createFile(
        STORAGE_BUCKET, // Use consolidated bucket
        ID.unique(),
        file
      );
      // Get the file URL for viewing
      const fileUrl = storage.getFileView(STORAGE_BUCKET, response.$id);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      // If bucket doesn't exist, provide helpful error
      if (error.code === 404) {
        throw new Error(`Storage bucket "${STORAGE_BUCKET}" not found. Please create it in Appwrite console.`);
      }
      // Fallback to local object URL
      if (file instanceof File || file instanceof Blob) {
        return URL.createObjectURL(file);
      }
      throw error;
    }
  },

  getFileUrl(fileId) {
    // Simplified to use consolidated bucket
    return storage.getFileView(STORAGE_BUCKET, fileId);
  }
};

// Export status check function for UI components
export const getAppwriteStatus = () => ({
  isAvailable: isAppwriteAvailable,
  mode: isAppwriteAvailable ? 'online' : 'offline'
});