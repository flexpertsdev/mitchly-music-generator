export const validateSongEvent = (event) => {
  if (!event.$id) {
    throw new Error('Event missing $id');
  }
  
  if (event.$collection !== 'songs') {
    throw new Error('Not a song collection event');
  }
  
  if (event.status !== 'generating') {
    throw new Error('Song status is not "generating"');
  }
  
  return true;
};

export const validateEnvironment = () => {
  const required = [
    'APPWRITE_FUNCTION_API_ENDPOINT',
    'APPWRITE_FUNCTION_PROJECT_ID',
    'ANTHROPIC_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
