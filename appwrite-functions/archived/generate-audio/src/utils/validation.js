export const validateAudioEvent = (event) => {
  if (!event) {
    throw new Error('No event data provided');
  }
  
  // For direct HTTP calls
  if (event.songId) {
    return { isDirectCall: true, songId: event.songId };
  }
  
  // For database trigger events
  if (!event.$id) {
    throw new Error('Event missing $id');
  }
  
  if (event.$collection !== 'songs') {
    throw new Error('Not a song collection event');
  }
  
  if (event.audioStatus !== 'generating') {
    throw new Error('Audio status is not "generating"');
  }
  
  if (!event.lyrics) {
    throw new Error('Song must have lyrics before generating audio');
  }
  
  return { isDirectCall: false, songId: event.$id };
};

export const validateEnvironment = () => {
  const required = [
    'APPWRITE_FUNCTION_PROJECT_ID',
    'MUREKA_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const parseRequestBody = (body) => {
  // Handle different body formats
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }
  }
  return body || {};
};

export const prepareMurekaPayload = (songData, bandData = null) => {
  // Build artist description from band data if available
  let artistDescription = songData.artistDescription || 'Modern band with unique sound';
  
  if (bandData) {
    const genre = bandData.primaryGenre || songData.primaryGenre || 'Rock';
    const bandName = bandData.bandName || 'Unknown Artist';
    artistDescription = `${bandName} - ${genre} band`;
  }
  
  return {
    title: songData.title || 'Untitled',
    lyrics: songData.lyrics,
    artist_description: artistDescription,
    song_description: songData.description || 'Original composition',
    make_instrumental: false
  };
};
