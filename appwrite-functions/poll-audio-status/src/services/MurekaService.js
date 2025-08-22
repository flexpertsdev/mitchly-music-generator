export class MurekaService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Mureka API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.mureka.ai/v2';
  }
  
  /**
   * Check task status
   * @param {string} taskId - The task ID to check
   * @returns {Promise<Object>}
   */
  async checkStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/music/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Mureka API error: ${response.status}`);
    }
    
    return await response.json();
  }
}
