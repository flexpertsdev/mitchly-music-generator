// src/services/anthropic.js
import { ENDPOINTS } from '../config/api';

export const generateBandProfile = async (prompt, advancedData = null, onProgress = null) => {
  try {
    const response = await fetch(ENDPOINTS.generateBand, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conceptText: prompt, advancedData })
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

// Simulated streaming version with progress updates
export const generateBandProfileStream = async (prompt, advancedData = null, onProgress = null) => {
  try {
    // Simulate progress updates since Netlify doesn't support true streaming
    const progressSteps = [
      { type: 'progress', step: 'start', message: '🎸 Starting the creative process...', progress: 5 },
      { type: 'progress', step: 'analyzing', message: '🤔 Analyzing your musical vision...', progress: 10 },
      { type: 'progress', step: 'band_identity', message: '🎤 Creating band identity...', progress: 20 },
      { type: 'progress', step: 'backstory', message: '📖 Writing our origin story...', progress: 30 },
      { type: 'progress', step: 'visual_identity', message: '🎨 Designing visual aesthetic...', progress: 40 },
      { type: 'progress', step: 'album_concept', message: '💿 Brainstorming album concept...', progress: 50 },
      { type: 'progress', step: 'track_listing', message: '🎵 Coming up with killer tracks...', progress: 60 },
      { type: 'progress', step: 'generating_logo', message: '✨ Creating a wicked logo...', progress: 70 },
      { type: 'progress', step: 'photo_shoot', message: '📸 Having our first photo shoot...', progress: 80 },
      { type: 'progress', step: 'album_cover', message: '🎨 Designing album artwork...', progress: 90 },
      { type: 'progress', step: 'finalizing', message: '🚀 Finalizing everything...', progress: 95 }
    ];

    // Start showing progress
    if (onProgress) {
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          onProgress(progressSteps[currentStep]);
          currentStep++;
        }
      }, 800); // Update every 800ms

      try {
        // Call the streaming endpoint (which is now just a regular endpoint)
        const response = await fetch(ENDPOINTS.generateBandStream, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, advancedData })
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Show completion
        onProgress({ type: 'progress', step: 'complete', message: '🎉 Band profile complete!', progress: 100 });
        
        // Parse the profileData if it's a string
        if (typeof data.profileData === 'string') {
          data.profileData = JSON.parse(data.profileData);
        }
        
        return data;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } else {
      // No progress callback, just call normally
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