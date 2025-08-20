// Mureka AI audio generation service

export async function generateAudio(songTitle, songDescription, lyrics, songId = null) {
  try {
    // Combine description and title for the prompt
    const prompt = `${songDescription}. Song: "${songTitle}"`;
    
    const response = await fetch('/.netlify/functions/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lyrics,
        prompt,
        model: 'mureka-o1',
        stream: false,
        songId // Add songId to the request
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start audio generation');
    }

    const result = await response.json();
    return {
      taskId: result.id,
      status: result.status,
      createdAt: result.createdAt
    };
  } catch (error) {
    console.error('Error starting audio generation:', error);
    throw error;
  }
}

export async function checkAudioStatus(taskId, songId = null) {
  try {
    const response = await fetch('/.netlify/functions/check-audio-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId, songId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check audio status');
    }

    const result = await response.json();
    return {
      status: result.status,
      audioUrl: result.audio_url,
      progress: result.progress || 0,
      error: result.error
    };
  } catch (error) {
    console.error('Error checking audio status:', error);
    throw error;
  }
}

// Poll for audio completion
export async function pollAudioGeneration(taskId, onProgress, songId = null) {
  const maxAttempts = 60; // 5 minutes max (5 second intervals)
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Audio generation timed out'));
        return;
      }
      
      try {
        const status = await checkAudioStatus(taskId, songId);
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === 'completed' && status.audioUrl) {
          clearInterval(checkInterval);
          resolve(status);
        } else if (status.status === 'failed' || status.error) {
          clearInterval(checkInterval);
          reject(new Error(status.error || 'Audio generation failed'));
        }
        // Continue polling if status is 'pending' or 'processing'
      } catch (error) {
        clearInterval(checkInterval);
        reject(error);
      }
    }, 5000); // Check every 5 seconds
  });
}

// Helper functions for Mureka integration
function formatLyricsForMureka(lyrics) {
  // Mureka expects clean lyrics without excessive line breaks
  return lyrics
    .split('\n')
    .filter(line => line.trim())
    .join('\n');
}

function generatePromptFromProfile(bandProfile) {
  return `${bandProfile.primaryGenre} style, ${bandProfile.vocalStyle?.type || bandProfile.vocalStyle}. ${bandProfile.coreSound}`;
}

async function pollForCompletion(taskId, onProgress, maxAttempts = 60, interval = 5000) {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Audio generation timed out'));
        return;
      }
      
      try {
        const status = await checkAudioStatus(taskId);
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === 'succeeded' && status.audioUrl) {
          clearInterval(checkInterval);
          resolve({
            songs: [{
              audioUrl: status.audioUrl,
              duration: status.duration || null
            }]
          });
        } else if (status.status === 'failed' || status.error) {
          clearInterval(checkInterval);
          reject(new Error(status.error || 'Audio generation failed'));
        }
        // Continue polling if status is 'pending' or 'processing'
      } catch (error) {
        clearInterval(checkInterval);
        reject(error);
      }
    }, interval);
  });
}

// Export as a service object
export const murekaService = {
  generateAudio,
  checkAudioStatus,
  pollAudioGeneration,
  formatLyricsForMureka,
  generatePromptFromProfile,
  pollForCompletion
};