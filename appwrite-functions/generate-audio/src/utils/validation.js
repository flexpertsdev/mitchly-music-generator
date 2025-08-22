export const validateAudioEvent = (event) => {
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
  
  return true;
};

export const validateEnvironment = () => {
  const required = [
    'APPWRITE_FUNCTION_API_ENDPOINT',
    'APPWRITE_FUNCTION_PROJECT_ID',
    'MUREKA_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
