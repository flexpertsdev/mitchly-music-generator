import { POLLING_CONFIG } from '../config.js';

export const shouldSkipSong = (song) => {
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
