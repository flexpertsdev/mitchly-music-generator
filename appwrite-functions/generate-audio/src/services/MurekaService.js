import { MUREKA_CONFIG } from '../config.js';

export class MurekaService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Mureka API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = MUREKA_CONFIG.API_URL;
  }
  
  /**
   * Generate music from lyrics
   * @param {Object} payload - The music generation payload
   * @returns {Promise<{task_id: string}>}
   */
  async generateMusic(payload) {
    let lastError;
    
    for (let attempt = 1; attempt <= MUREKA_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/music/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            temperature: payload.temperature || MUREKA_CONFIG.DEFAULT_TEMPERATURE,
            top_k: payload.top_k || MUREKA_CONFIG.DEFAULT_TOP_K,
            top_p: payload.top_p || MUREKA_CONFIG.DEFAULT_TOP_P
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          
          // Check for rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            throw new Error(`Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`);
          }
          
          throw new Error(`Mureka API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.task_id) {
          throw new Error('No task_id returned from Mureka API');
        }
        
        return data;
      } catch (error) {
        lastError = error;
        
        if (attempt < MUREKA_CONFIG.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, MUREKA_CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
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
