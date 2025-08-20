// API endpoints configuration
export const ENDPOINTS = {
  // Netlify Functions endpoints - Direct URLs for debugging
  generateBand: '/.netlify/functions/generate-band',
  generateBandStream: '/.netlify/functions/generate-band-stream',
  generateSong: '/.netlify/functions/generate-song',
  generateAudio: '/.netlify/functions/generate-audio',
  checkAudioStatus: '/.netlify/functions/check-audio-status'
};

// Edge function endpoints
export const EDGE_ENDPOINTS = {
  generateBandSSE: '/.netlify/edge-functions/generate-band-sse',
  generateBandStreamProduction: '/.netlify/edge-functions/generate-band-stream-production'
};

export default ENDPOINTS;