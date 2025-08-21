/**
 * Legacy Appwrite Service File
 * This file redirects to the new modular structure in /appwrite/
 * Kept for backward compatibility during migration
 */

// Re-export everything from the new modular structure
export * from './appwrite/index.js';
export * from './appwrite/database.js';
export * from './appwrite/storage.js';
export * from './appwrite/schema.js';

// Legacy exports for backward compatibility
import { bandService as newBandService, songService as newSongService, albumService } from './appwrite/database.js';
import { storageService as newStorageService } from './appwrite/storage.js';
import { DATABASE_ID, STORAGE_BUCKET, COLLECTIONS } from './appwrite/schema.js';
import { client } from './appwrite/index.js';
import { databases, storage, ID, Query } from 'appwrite';

// Initialize services with client
const databasesLegacy = databases || new Databases(client);
const storageLegacy = storage || new Storage(client);

// Export legacy names
export const bandService = newBandService;
export const songService = newSongService;
export const storageService = newStorageService;
export { albumService };
export { DATABASE_ID, STORAGE_BUCKET, COLLECTIONS };
export { databasesLegacy as databases, storageLegacy as storage, ID, Query };

// Legacy compatibility function
export const getAppwriteStatus = () => {
  const { getDatabaseStatus } = require('./appwrite/database.js');
  return getDatabaseStatus();
};

console.info('Using new modular Appwrite service structure from /services/appwrite/');
