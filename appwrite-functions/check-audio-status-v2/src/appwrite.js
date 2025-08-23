import { Client, Databases } from 'node-appwrite';

class AppwriteService {
  constructor(apiKey) {
    const client = new Client();
    
    // Use provided API key or fall back to environment variable
    const key = apiKey || process.env.APPWRITE_FUNCTION_API_KEY;
    
    if (!key) {
      throw new Error('Appwrite API key is required');
    }
    
    client
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(key);

    this.databases = new Databases(client);
  }

  /**
   * Update song document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {string} songId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateSong(databaseId, collectionId, songId, data) {
    return await this.databases.updateDocument(
      databaseId,
      collectionId,
      songId,
      data
    );
  }
}

export default AppwriteService;