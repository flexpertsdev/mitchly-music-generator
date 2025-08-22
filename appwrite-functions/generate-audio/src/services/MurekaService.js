import { DATABASE_CONFIG } from '../config.js';

export class MurekaService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Mureka API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.mureka.ai/v2';
  }
  
  /**
   * Generate music from lyrics
   * @param {Object} payload - The music generation payload
   * @returns {Promise<{task_id: string}>}
   */
  async generateMusic(payload) {
    const response = await fetch(`${this.baseUrl}/music/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mureka API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
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
