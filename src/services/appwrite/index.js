/**
 * Main Appwrite configuration and client setup
 */
import { Client } from 'appwrite';

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'flexos');

// Export database and collection IDs from schema
export { DATABASE_ID, STORAGE_BUCKET, COLLECTIONS } from './schema.js';

// Service status tracking
export const serviceStatus = {
  isAvailable: true,
  lastCheck: 0,
  checkInterval: 30000 // 30 seconds
};

// Export all service modules
export * from './database.js';
export * from './storage.js';
export * from './schema.js';
