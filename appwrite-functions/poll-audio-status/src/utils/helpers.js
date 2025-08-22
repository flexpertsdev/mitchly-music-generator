import { POLLING_CONFIG, MUREKA_CONFIG } from '../config.js';

export const shouldSkipSong = (song, forceCheck = false) => {
  if (forceCheck) {
    return false;
  }
  
  if (!song.lastStatusCheck) {
    return false;
  }
  
  const lastCheck = new Date(song.lastStatusCheck).getTime();
  return Date.now() - lastCheck < POLLING_CONFIG.RATE_LIMIT_COOLDOWN;
};

export const isTimeout = (song) => {
  const startTime = new Date(song.audioGenerationStartedAt);
  const now = new Date();
  const minutesElapsed = (now - startTime) / (1000 * 60);
  
  return minutesElapsed > POLLING_CONFIG.TIMEOUT_MINUTES;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getStatusCategory = (status) => {
  const normalizedStatus = status?.toLowerCase();
  
  if (MUREKA_CONFIG.VALID_STATUSES.COMPLETED.includes(normalizedStatus)) {
    return 'completed';
  }
  
  if (MUREKA_CONFIG.VALID_STATUSES.FAILED.includes(normalizedStatus)) {
    return 'failed';
  }
  
  if (MUREKA_CONFIG.VALID_STATUSES.PROCESSING.includes(normalizedStatus)) {
    return 'processing';
  }
  
  return 'unknown';
};

export const parseRequestBody = (body) => {
  // Handle different body formats
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      return {};
    }
  }
  return body || {};
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
