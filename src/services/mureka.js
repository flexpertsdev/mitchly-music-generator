// Mureka AI Audio Generation Service

const isProduction = import.meta.env.PROD;
const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');

// For development, we can optionally use direct API calls if key is present
const MUREKA_API_KEY = import.meta.env.VITE_MUREKA_API_KEY;
const useServerless = isProduction || isNetlify || !MUREKA_API_KEY;

export const murekaService = {
  /**
   * Start audio generation for a song
   * @param {string} lyrics - The song lyrics with structure tags
   * @param {string} prompt - Music style prompt (e.g., "r&b, slow, passionate, male vocal")
   * @param {string} model - Model to use (default: 'mureka-o1')
   * @returns {Promise<{taskId: string, status: string}>}
   */
  async generateAudio(lyrics, prompt, model = 'mureka-o1') {
    if (useServerless) {
      // Use Netlify serverless function
      const response = await fetch('/.netlify/functions/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lyrics, prompt, model, stream: false })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      return await response.json();
    } else {
      // Direct API call for local development
      const response = await fetch('https://api.mureka.ai/v1/song/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MUREKA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lyrics,
          model,
          prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const task = await response.json();
      return {
        taskId: task.id,
        status: task.status,
        createdAt: task.created_at,
        model: task.model
      };
    }
  },

  /**
   * Check the status of an audio generation task
   * @param {string} taskId - The task ID to check
   * @returns {Promise<Object>} Task status and audio URL if completed
   */
  async checkStatus(taskId) {
    if (useServerless) {
      // Use Netlify serverless function
      const response = await fetch(`/.netlify/functions/check-audio-status?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check status');
      }

      return await response.json();
    } else {
      // Direct API call for local development
      const response = await fetch(`https://api.mureka.ai/v1/song/query/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MUREKA_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const taskData = await response.json();

      const result = {
        taskId: taskData.id,
        status: taskData.status,
        createdAt: taskData.created_at,
        finishedAt: taskData.finished_at,
        model: taskData.model,
        failedReason: taskData.failed_reason
      };

      if (taskData.status === 'succeeded' && taskData.choices && taskData.choices.length > 0) {
        result.songs = taskData.choices.map(choice => ({
          id: choice.id,
          title: choice.title,
          audioUrl: choice.audio_url,
          duration: choice.duration,
          imageUrl: choice.image_url
        }));
      }

      if (taskData.status === 'streaming' && taskData.stream_url) {
        result.streamUrl = taskData.stream_url;
      }

      return result;
    }
  },

  /**
   * Poll for task completion
   * @param {string} taskId - The task ID to poll
   * @param {Function} onProgress - Callback for progress updates
   * @param {number} maxAttempts - Maximum polling attempts (default: 60)
   * @param {number} interval - Polling interval in ms (default: 5000)
   * @returns {Promise<Object>} Completed task with audio URL
   */
  async pollForCompletion(taskId, onProgress = null, maxAttempts = 60, interval = 5000) {
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const status = await this.checkStatus(taskId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'succeeded') {
          return status;
        }

        if (status.status === 'failed' || status.status === 'cancelled' || status.status === 'timeouted') {
          throw new Error(status.failedReason || `Task ${status.status}`);
        }

        if (attempts >= maxAttempts) {
          throw new Error('Generation timeout - task took too long');
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, interval));
        return poll();
      } catch (error) {
        console.error('Polling error:', error);
        throw error;
      }
    };

    return poll();
  },

  /**
   * Format lyrics for Mureka AI
   * Ensures proper structure tags for AI music generation
   */
  formatLyricsForMureka(lyrics) {
    // Check if lyrics already have structure tags
    if (lyrics.includes('[') && lyrics.includes(']')) {
      return lyrics;
    }

    // Add basic structure if missing
    const lines = lyrics.split('\n').filter(line => line.trim());
    const formatted = [];
    
    formatted.push('[Intro]');
    formatted.push('(Instrumental intro)');
    formatted.push('');
    
    let verseCount = 0;
    let inChorus = false;
    
    lines.forEach((line, index) => {
      // Simple heuristic: if line repeats, it might be chorus
      const isRepeated = lines.filter(l => l === line).length > 1;
      
      if (isRepeated && !inChorus) {
        formatted.push('[Chorus]');
        inChorus = true;
      } else if (!isRepeated && inChorus) {
        verseCount++;
        formatted.push(`[Verse ${verseCount}]`);
        inChorus = false;
      } else if (index === 0 || (!inChorus && index % 4 === 0)) {
        verseCount++;
        formatted.push(`[Verse ${verseCount}]`);
      }
      
      formatted.push(line);
    });
    
    formatted.push('');
    formatted.push('[Outro]');
    formatted.push('(Instrumental fade out)');
    
    return formatted.join('\n');
  },

  /**
   * Generate prompt from band profile
   */
  generatePromptFromProfile(bandProfile) {
    const vocalType = bandProfile.vocalStyle?.type || 'mixed vocals';
    const genre = bandProfile.primaryGenre || 'alternative';
    const influences = bandProfile.influences?.slice(0, 2).join(', ') || '';
    
    let prompt = `${genre}, ${vocalType}`;
    
    if (influences) {
      prompt += `, inspired by ${influences}`;
    }
    
    // Add production style hints
    if (bandProfile.productionStyle) {
      const productionKeywords = bandProfile.productionStyle.toLowerCase();
      if (productionKeywords.includes('electronic')) prompt += ', electronic production';
      if (productionKeywords.includes('acoustic')) prompt += ', acoustic';
      if (productionKeywords.includes('orchestral')) prompt += ', orchestral';
      if (productionKeywords.includes('raw')) prompt += ', raw production';
      if (productionKeywords.includes('polished')) prompt += ', polished production';
    }
    
    return prompt;
  }
};