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
    try {
      const response = await fetch(`${this.baseUrl}/music/status/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mureka API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Normalize the response to ensure consistent field names
      return {
        status: data.status,
        audio_url: data.audio_url || data.download_url || data.url,
        duration: data.duration,
        error: data.error || data.error_message,
        created_at: data.created_at,
        completed_at: data.completed_at
      };
    } catch (error) {
      // Network or parsing errors
      throw new Error(`Failed to check status: ${error.message}`);
    }
  }
  
  /**
   * Check multiple task statuses in batch
   * @param {string[]} taskIds - Array of task IDs to check
   * @returns {Promise<Object[]>}
   */
  async checkMultipleStatuses(taskIds) {
    const results = [];
    
    for (const taskId of taskIds) {
      try {
        const status = await this.checkStatus(taskId);
        results.push({ taskId, ...status });
      } catch (error) {
        results.push({ 
          taskId, 
          status: 'error',
          error: error.message 
        });
      }
    }
    
    return results;
  }
}
