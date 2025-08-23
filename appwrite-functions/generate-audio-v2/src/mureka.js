import axios from 'axios';

class MurekaService {
  constructor() {
    this.apiKey = process.env.MUREKA_API_KEY;
    this.baseUrl = 'https://api.mureka.ai/v1';
    
    if (!this.apiKey) {
      throw new Error('MUREKA_API_KEY is required');
    }
  }

  /**
   * Generate audio from lyrics
   * @param {object} params
   * @returns {Promise<object>}
   */
  async generateAudio(params) {
    const { title, lyrics, description, artistDescription, genre, style } = params;
    
    // Create a descriptive prompt from the metadata
    const promptParts = [];
    if (genre) promptParts.push(genre.toLowerCase());
    if (style) promptParts.push(style.toLowerCase());
    if (description) promptParts.push(description.toLowerCase());
    
    // Default prompt if none provided
    const prompt = promptParts.length > 0 
      ? promptParts.join(', ')
      : 'alternative rock, dynamic, energetic';
    
    // Log the request for debugging
    console.log('Mureka API request:', {
      url: `${this.baseUrl}/song/generate`,
      lyricsLength: lyrics?.length,
      model: 'auto',
      prompt: prompt
    });
    
    try {
      const requestBody = {
        lyrics: lyrics,
        model: 'auto',
        prompt: prompt
      };
      
      console.log('Sending request to Mureka API...');
      
      const response = await axios.post(
        `${this.baseUrl}/song/generate`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log('Mureka API response status:', response.status);
      console.log('Mureka API response data:', JSON.stringify(response.data).substring(0, 200));
      
      // The response should have an 'id' field which is the task ID
      const taskId = response.data?.id;
      
      if (taskId) {
        return {
          success: true,
          taskId: taskId,
          status: response.data?.status || 'processing'
        };
      }
      
      throw new Error(`Invalid response from Mureka API: ${JSON.stringify(response.data).substring(0, 200)}`);
    } catch (error) {
      console.error('Mureka API error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid Mureka API key');
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient Mureka credits');
      } else if (error.response?.status === 429) {
        throw new Error('Mureka API rate limit exceeded');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Mureka API request timeout');
      }
      
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.response?.data?.detail ||
        `Failed to generate audio: ${error.message}`
      );
    }
  }

  /**
   * Check generation status
   * @param {string} taskId
   * @returns {Promise<object>}
   */
  async checkStatus(taskId) {
    try {
      // Use the correct endpoint: /v1/song/query/{task_id}
      const response = await axios.get(
        `${this.baseUrl}/song/query/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const data = response.data;
      console.log(`Mureka status check for ${taskId}: ${data.status}`);
      
      // Extract audio URL from choices array if available
      let audioUrl = null;
      let duration = null;
      
      if (data.choices && data.choices.length > 0) {
        const firstChoice = data.choices[0];
        // Try different possible URL fields
        audioUrl = firstChoice.url || firstChoice.stream_url || firstChoice.flac_url || null;
        duration = firstChoice.duration || null;
      }
      
      // Map Mureka status to our internal status
      // Mureka statuses: preparing, queued, running, streaming, succeeded, failed, timeouted, cancelled
      let normalizedStatus;
      switch(data.status) {
        case 'succeeded':
          normalizedStatus = 'completed';
          break;
        case 'failed':
        case 'timeouted':
        case 'cancelled':
          normalizedStatus = 'failed';
          break;
        case 'preparing':
        case 'queued':
        case 'running':
        case 'streaming':
          normalizedStatus = 'processing';
          break;
        default:
          normalizedStatus = 'processing';
      }
      
      // Calculate progress based on status
      let progress = 0;
      if (data.status === 'succeeded') progress = 100;
      else if (data.status === 'running' || data.status === 'streaming') progress = 50;
      else if (data.status === 'queued') progress = 25;
      else if (data.status === 'preparing') progress = 10;
      
      return {
        taskId: taskId,
        status: normalizedStatus,
        progress: progress,
        audioUrl: audioUrl,
        duration: duration,
        error: data.failed_reason || null
      };
    } catch (error) {
      console.error('Mureka status check error:', error.response?.data || error.message);
      
      // If it's a 404, the task might not exist yet
      if (error.response?.status === 404) {
        return {
          taskId: taskId,
          status: 'pending',
          progress: 0
        };
      }
      
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to check audio status'
      );
    }
  }

  /**
   * Cancel a generation task
   * @param {string} taskId
   * @returns {Promise<object>}
   */
  async cancelTask(taskId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/song/cancel/${taskId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return {
        success: true,
        message: 'Task cancelled successfully'
      };
    } catch (error) {
      console.error('Mureka cancel error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to cancel task'
      );
    }
  }
}

export default MurekaService;