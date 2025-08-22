import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_CONFIG } from '../config.js';

export class AppwriteService {
  constructor(endpoint, projectId, apiKey) {
    this.client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    this.databases = new Databases(this.client);
  }
  
  async getBand(bandId) {
    if (!bandId) return null;
    
    try {
      const band = await this.databases.getDocument(
        DATABASE_CONFIG.DATABASE_ID,
        'bands',
        bandId
      );
      
      // Parse profile data if it's a string
      if (band.profileData) {
        band.profileData = typeof band.profileData === 'string' 
          ? JSON.parse(band.profileData) 
          : band.profileData;
      }
      
      return band;
    } catch (error) {
      throw new Error(`Failed to fetch band: ${error.message}`);
    }
  }
  
  async updateSongWithLyrics(songId, lyrics, description) {
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      'songs',
      songId,
      {
        lyrics: lyrics,
        description: description,
        status: 'completed',
        lyricsGeneratedAt: new Date().toISOString()
      }
    );
  }
  
  async updateSongStatus(songId, status, error = null) {
    const updateData = { status };
    
    if (error) {
      updateData.generationError = error;
    }
    
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      'songs',
      songId,
      updateData
    );
  }
}
