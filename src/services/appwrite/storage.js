/**
 * Appwrite Storage Service
 * Handles file uploads and storage operations
 */
import { Client, Storage, ID } from 'appwrite';
import { STORAGE_BUCKET } from './schema.js';

// Initialize client locally to avoid circular dependency
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'flexos');

// Initialize storage service
const storage = new Storage(client);

// Service status (shared with other services)
export const serviceStatus = {
  isAvailable: true,
  lastCheck: 0,
  checkInterval: 30000
};

// Storage operations
export const storageService = {
  async uploadImage(file) {
    try {
      if (!serviceStatus.isAvailable) {
        console.warn('Storage not available in offline mode');
        // Return a placeholder or data URL for local storage
        return URL.createObjectURL(file);
      }
      
      const response = await storage.createFile(
        STORAGE_BUCKET,
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
      if (!serviceStatus.isAvailable) {
        console.warn('Storage not available in offline mode');
        return URL.createObjectURL(file);
      }
      
      const response = await storage.createFile(
        STORAGE_BUCKET,
        ID.unique(),
        file
      );
      
      // Get the file URL for viewing
      const fileUrl = storage.getFileView(STORAGE_BUCKET, response.$id);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      
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

  async uploadFile(file, options = {}) {
    const { onProgress } = options;
    
    try {
      if (!serviceStatus.isAvailable) {
        console.warn('Storage not available in offline mode');
        return URL.createObjectURL(file);
      }
      
      const fileId = ID.unique();
      
      // Upload with progress tracking if callback provided
      const uploadPromise = storage.createFile(
        STORAGE_BUCKET,
        fileId,
        file
      );
      
      if (onProgress) {
        // Note: Appwrite SDK doesn't natively support progress tracking
        // This is a placeholder for when it's supported
        console.info('Progress tracking not yet supported by Appwrite SDK');
      }
      
      const response = await uploadPromise;
      
      // Get the file URL for viewing
      const fileUrl = storage.getFileView(STORAGE_BUCKET, response.$id);
      return {
        url: fileUrl,
        fileId: response.$id
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async deleteFile(fileId) {
    try {
      await storage.deleteFile(STORAGE_BUCKET, fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  getFileUrl(fileId) {
    return storage.getFileView(STORAGE_BUCKET, fileId);
  },

  getFileDownloadUrl(fileId) {
    return storage.getFileDownload(STORAGE_BUCKET, fileId);
  },

  async getFilePreview(fileId, options = {}) {
    const {
      width = 300,
      height = 300,
      gravity = 'center',
      quality = 90,
      borderWidth = 0,
      borderColor = '000000',
      borderRadius = 0,
      opacity = 1,
      rotation = 0,
      background = 'FFFFFF',
      output = 'jpg'
    } = options;
    
    try {
      return storage.getFilePreview(
        STORAGE_BUCKET,
        fileId,
        width,
        height,
        gravity,
        quality,
        borderWidth,
        borderColor,
        borderRadius,
        opacity,
        rotation,
        background,
        output
      );
    } catch (error) {
      console.error('Error getting file preview:', error);
      throw error;
    }
  }
};

// Export storage status
export const getStorageStatus = () => ({
  isAvailable: serviceStatus.isAvailable,
  mode: serviceStatus.isAvailable ? 'online' : 'offline'
});
