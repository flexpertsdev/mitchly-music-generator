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
}
