import { storage, ID } from './appwrite';

const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'mitchly-media';
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6761a31600224c0e82df';

class StorageService {
  constructor() {
    this.bucketId = BUCKET_ID;
  }

  /**
   * Upload an image from URL to Appwrite Storage
   */
  async uploadImageFromUrl(imageUrl, fileName) {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      
      // Upload to Appwrite Storage
      const result = await storage.createFile(
        this.bucketId,
        ID.unique(),
        file
      );
      
      // Return the public URL
      return this.getFileUrl(result.$id);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Return original URL as fallback
      return imageUrl;
    }
  }

  /**
   * Upload band images to Appwrite Storage
   */
  async uploadBandImages(bandId, images) {
    const uploadedImages = {};
    
    try {
      if (images.logo) {
        uploadedImages.logoUrl = await this.uploadImageFromUrl(
          images.logo,
          `${bandId}_logo.png`
        );
      }
      
      if (images.albumCover) {
        uploadedImages.albumCoverUrl = await this.uploadImageFromUrl(
          images.albumCover,
          `${bandId}_album.png`
        );
      }
      
      if (images.bandPhoto) {
        uploadedImages.bandPhotoUrl = await this.uploadImageFromUrl(
          images.bandPhoto,
          `${bandId}_photo.png`
        );
      }
      
      return uploadedImages;
    } catch (error) {
      console.error('Error uploading band images:', error);
      // Return original URLs as fallback
      return {
        logoUrl: images.logo,
        albumCoverUrl: images.albumCover,
        bandPhotoUrl: images.bandPhoto
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(fileId) {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${PROJECT_ID}`;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileId) {
    try {
      await storage.deleteFile(this.bucketId, fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();