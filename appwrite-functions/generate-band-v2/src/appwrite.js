import { Client, Databases, ID } from 'node-appwrite';

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
   * Create band document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createBand(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }

  /**
   * Update band document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {string} bandId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateBand(databaseId, collectionId, bandId, data) {
    return await this.databases.updateDocument(
      databaseId,
      collectionId,
      bandId,
      data
    );
  }

  /**
   * Create album document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createAlbum(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }

  /**
   * Update album document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {string} albumId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateAlbum(databaseId, collectionId, albumId, data) {
    return await this.databases.updateDocument(
      databaseId,
      collectionId,
      albumId,
      data
    );
  }

  /**
   * Create song document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createSong(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }
}

export default AppwriteService;
