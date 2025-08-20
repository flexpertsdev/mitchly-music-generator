// src/services/anthropic.js
import { ENDPOINTS } from '../config/api';

class StreamingProgress {
  constructor(onProgress) {
    this.onProgress = onProgress;
  }

  async processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress' && this.onProgress) {
                this.onProgress(data);
              } else if (data.type === 'complete') {
                result = data.data;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  }
}

export const generateBandProfile = async (prompt, advancedData = null, onProgress = null) => {
  try {
    const response = await fetch(ENDPOINTS.generateBand, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, advancedData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the profileData if it's a string
    if (typeof data.profileData === 'string') {
      data.profileData = JSON.parse(data.profileData);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating band profile:', error);
    throw error;
  }
};

// New streaming version with progress updates
export const generateBandProfileStream = async (prompt, advancedData = null, onProgress = null) => {
  try {
    const response = await fetch(ENDPOINTS.generateBandStream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, advancedData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // If we have a progress callback, use streaming
    if (onProgress) {
      const streaming = new StreamingProgress(onProgress);
      return await streaming.processStream(response);
    } else {
      // Fall back to regular response
      const data = await response.json();
      if (typeof data.profileData === 'string') {
        data.profileData = JSON.parse(data.profileData);
      }
      return data;
    }
  } catch (error) {
    console.error('Error generating band profile:', error);
    throw error;
  }
};

export const generateSong = async (songTitle, trackNumber, bandProfile, songId = null, bandId = null) => {
  try {
    const response = await fetch(ENDPOINTS.generateSong, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        songTitle, 
        trackNumber, 
        bandProfile,
        songId,
        bandId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating song:', error);
    throw error;
  }
};