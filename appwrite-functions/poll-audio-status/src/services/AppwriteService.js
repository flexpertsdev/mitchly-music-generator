import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_CONFIG, POLLING_CONFIG } from '../config.js';

export class AppwriteService {
  constructor(endpoint, projectId, apiKey) {
    this.client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    this.databases = new Databases(this.client);
  }
  
  async getProcessingSongs() {
    const cutoffTime = new Date(Date.now() - POLLING_CONFIG.RATE_LIMIT_COOLDOWN).toISOString();
    const initialDelayCutoff = new Date(Date.now() - POLLING_CONFIG.INITIAL_DELAY).toISOString();
    
    const queries = [
      Query.equal('audioStatus', 'processing'),
      Query.isNotNull('murekaTaskId'),
      Query.lessThan('audioGenerationStartedAt', initialDelayCutoff),
      Query.limit(POLLING_CONFIG.MAX_SONGS_PER_RUN)
    ];
    
    return await this.databases.listDocuments(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      queries
    );
  }
  
  async updateSongStatusCheck(songId, checkAttempts) {
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId,
      {
        lastStatusCheck: new Date().toISOString(),
        checkAttempts: checkAttempts + 1
      }
    );
  }
  
  async updateSongAudioCompleted(songId, audioUrl, duration, checkAttempts) {
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId,
      {
        audioStatus: 'completed',
        audioUrl: audioUrl,
        audioDuration: duration || null,
        audioCompletedAt: new Date().toISOString(),
        totalCheckAttempts: checkAttempts + 1
      }
    );
  }
  
  async updateSongAudioFailed(songId, error) {
    return await this.databases.updateDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId,
      {
        audioStatus: 'failed',
        audioError: error
      }
    );
  }
}
