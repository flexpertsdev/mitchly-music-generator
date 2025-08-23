export const validateSongEvent = (event) => {
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
  
  if (event.status !== 'generating') {
    throw new Error('Song status is not "generating"');
  }
  
  return { isDirectCall: false, songId: event.$id };
};

export const validateEnvironment = () => {
  const required = [
    'APPWRITE_FUNCTION_PROJECT_ID',
    'ANTHROPIC_API_KEY'
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
