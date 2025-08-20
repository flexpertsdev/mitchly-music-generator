// Always use Netlify serverless functions for API security
export async function generateBandProfile(conceptText) {
  try {
    const response = await fetch('/.netlify/functions/generate-band', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conceptText })
    });

    if (!response.ok) {
      let errorMessage;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || `Server error: ${response.status}`;
        } catch (e) {
          // If JSON parsing fails, get text
          errorMessage = await response.text();
        }
      } else {
        // Non-JSON response (like timeout errors)
        errorMessage = await response.text();
      }
      
      throw new Error(errorMessage || 'Failed to generate band profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling serverless function:', error);
    throw error;
  }
}

export async function generateSong(songTitle, trackNumber, bandProfile, songId = null, bandId = null) {
  try {
    const response = await fetch('/.netlify/functions/generate-song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ songTitle, trackNumber, bandProfile, songId, bandId })
    });

    if (!response.ok) {
      let errorMessage;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || `Server error: ${response.status}`;
        } catch (e) {
          // If JSON parsing fails, get text
          errorMessage = await response.text();
        }
      } else {
        // Non-JSON response (like timeout errors)
        errorMessage = await response.text();
      }
      
      throw new Error(errorMessage || 'Failed to generate song');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling serverless function:', error);
    throw error;
  }
}