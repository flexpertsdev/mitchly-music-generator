import { Client, Databases } from 'node-appwrite';

class AppwriteService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Appwrite API key is required');
    }
    
    const client = new Client();
    
    // Use environment variables for endpoint and project
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || 'flexos';
    
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    this.databases = new Databases(client);
  }

  /**
   * Get a document from the database
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {string} documentId 
   * @returns {Promise<object>}
   */
  async getDocument(databaseId, collectionId, documentId) {
    try {
      const document = await this.databases.getDocument(
        databaseId,
        collectionId,
        documentId
      );
      return document;
    } catch (error) {
      console.error('Failed to get document:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  /**
   * Update a document in the database
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {string} documentId 
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async updateDocument(databaseId, collectionId, documentId, data) {
    try {
      const document = await this.databases.updateDocument(
        databaseId,
        collectionId,
        documentId,
        data
      );
      return document;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  /**
   * Create a document in the database
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {string} documentId 
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async createDocument(databaseId, collectionId, documentId, data) {
    try {
      const document = await this.databases.createDocument(
        databaseId,
        collectionId,
        documentId,
        data
      );
      return document;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Delete a document from the database
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {string} documentId 
   * @returns {Promise<void>}
   */
  async deleteDocument(databaseId, collectionId, documentId) {
    try {
      await this.databases.deleteDocument(
        databaseId,
        collectionId,
        documentId
      );
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * List documents with optional queries
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {Array} queries 
   * @returns {Promise<object>}
   */
  async listDocuments(databaseId, collectionId, queries = []) {
    try {
      const response = await this.databases.listDocuments(
        databaseId,
        collectionId,
        queries
      );
      return response;
    } catch (error) {
      console.error('Failed to list documents:', error);
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Batch update multiple documents
   * @param {string} databaseId 
   * @param {string} collectionId 
   * @param {Array<{id: string, data: object}>} updates 
   * @returns {Promise<Array>}
   */
  async batchUpdateDocuments(databaseId, collectionId, updates) {
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateDocument(
          databaseId,
          collectionId,
          update.id,
          update.data
        );
        results.push(result);
      } catch (error) {
        errors.push({
          id: update.id,
          error: error.message
        });
      }
    }
    
    if (errors.length > 0) {
      console.warn('Some batch updates failed:', errors);
    }
    
    return {
      successful: results,
      failed: errors
    };
  }
}

export default AppwriteService;