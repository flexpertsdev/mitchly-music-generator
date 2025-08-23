import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_CONFIG, POLLING_CONFIG, MUREKA_CONFIG } from '../config.js';

export class AppwriteService {
  constructor(endpoint, projectId, apiKey) {
    this.client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    this.databases = new Databases(this.client);
  }
  
  /**
   * Get all songs that are currently processing
   * @param {boolean} forceCheck - If true, ignore rate limiting
   */
  async getProcessingSongs(forceCheck = false) {
    const queries = [
      Query.equal('audioStatus', 'processing'),
      Query.isNotNull('murekaTaskId'),
      Query.limit(POLLING_CONFIG.MAX_SONGS_PER_RUN)
    ];
    
    // Add time-based filters only for scheduled runs
    if (!forceCheck) {
      const initialDelayCutoff = new Date(Date.now() - POLLING_CONFIG.INITIAL_DELAY).toISOString();
      queries.push(Query.lessThan('audioGenerationStartedAt', initialDelayCutoff));
    }
    
    return await this.databases.listDocuments(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      queries
    );
  }
  
  /**
   * Get a specific song by ID
   */
  async getSong(songId) {
    return await this.databases.getDocument(
      DATABASE_CONFIG.DATABASE_ID,
      DATABASE_CONFIG.SONGS_COLLECTION,
      songId
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
        audioError: error,
        audioCompletedAt: new Date().toISOString()
      }
    );
  }
}
