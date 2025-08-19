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
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate band profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling serverless function:', error);
    throw error;
  }
}

export async function generateSong(songTitle, trackNumber, bandProfile) {
  try {
    const response = await fetch('/.netlify/functions/generate-song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ songTitle, trackNumber, bandProfile })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate song');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling serverless function:', error);
    throw error;
  }
}