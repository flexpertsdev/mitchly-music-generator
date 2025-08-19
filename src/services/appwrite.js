import { Client, Databases, Storage, ID } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6761a31600224c0e82df');

// Add API key if provided (for server-side permissions)
if (import.meta.env.VITE_APPWRITE_API_KEY) {
  client.setKey(import.meta.env.VITE_APPWRITE_API_KEY);
}

// Initialize services
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const SONGS_COLLECTION = 'songs';

// Band operations
export const bandService = {
  async create(bandProfile) {
    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        ID.unique(),
        {
          bandName: bandProfile.bandName,
          primaryGenre: bandProfile.primaryGenre,
          profileData: JSON.stringify(bandProfile),
          imageUrl: bandProfile.imageUrl || null,
          logoUrl: bandProfile.logoUrl || null
        }
      );
      return document;
    } catch (error) {
      console.error('Error creating band:', error);
      throw error;
    }
  },

  async get(bandId) {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId
      );
      return {
        ...document,
        profileData: JSON.parse(document.profileData)
      };
    } catch (error) {
      console.error('Error getting band:', error);
      throw error;
    }
  },

  async list(limit = 10) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BANDS_COLLECTION,
        {
          limit,
          orderDesc: '$createdAt'
        }
      );
      return response.documents.map(doc => ({
        ...doc,
        profileData: JSON.parse(doc.profileData)
      }));
    } catch (error) {
      console.error('Error listing bands:', error);
      throw error;
    }
  },

  async update(bandId, updates) {
    try {
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
    } catch (error) {
      console.error('Error updating band:', error);
      throw error;
    }
  }
};

// Song operations
export const songService = {
  async create(song) {
    try {
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
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    }
  },

  async update(songId, updates) {
    try {
      const document = await databases.updateDocument(
        DATABASE_ID,
        SONGS_COLLECTION,
        songId,
        updates
      );
      return document;
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  },

  async getByBandId(bandId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SONGS_COLLECTION,
        {
          queries: [`bandId.equal("${bandId}")`],
          orderAsc: 'trackNumber'
        }
      );
      return response.documents;
    } catch (error) {
      console.error('Error getting songs by band:', error);
      throw error;
    }
  }
};

// Storage operations
export const storageService = {
  async uploadImage(file, bucketId = 'band-images') {
    try {
      const response = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
      // Get the file URL
      const fileUrl = storage.getFileView(bucketId, response.$id);
      return fileUrl.href;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async uploadAudio(file) {
    try {
      const response = await storage.createFile(
        'audio-files',
        ID.unique(),
        file
      );
      // Get the file URL
      const fileUrl = storage.getFileView('audio-files', response.$id);
      return fileUrl.href;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  },

  getFileUrl(bucketId, fileId) {
    return storage.getFileView(bucketId, fileId).href;
  }
};