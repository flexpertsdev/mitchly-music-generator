import { Client, Databases } from 'node-appwrite';
import { DATABASE_CONFIG } from '../config.js';

export class AppwriteService {
  constructor(endpoint, projectId, apiKey) {
    this.client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    this.databases = new Databases(this.client);
  }
  
  async getSong(songId) {
    try {
      return await this.databases.getDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.SONGS_COLLECTION,
        songId
      );
    } catch (error) {
      if (error.code === 404) {
        throw new Error('Song not found');
      }
      throw error;
    }
  }
  
  async getBand(bandId) {
    if (!bandId) return null;
    
    try {
      const band = await this.databases.getDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BANDS_COLLECTION,
        bandId
      );
      
      return band;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }
  
  async updateSongAudioStatus(songId, status, taskId = null, error = null) {
    const updateData = { audioStatus: status };
    
    if (taskId) {
      updateData.murekaTaskId = taskId;
      updateData.audioGenerationStartedAt = new Date().toISOString();
    }
    
    if (error) {
      updateData.audioError = error;
    }
    
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId,
      updateData
    );
  }
  
  async updateSongAudioCompleted(songId, audioUrl, duration = null) {
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId,
      {
        audioStatus: 'completed',
        audioUrl: audioUrl,
        audioDuration: duration,
        audioCompletedAt: new Date().toISOString()
      }
    );
  }
}
