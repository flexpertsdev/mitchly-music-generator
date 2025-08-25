/**
 * Main Appwrite exports
 * Re-exports all services and utilities
 */

// Export database and collection IDs from schema
export { DATABASE_ID, STORAGE_BUCKET, COLLECTIONS } from './schema.js';

// Export all service modules
export * from './database.js';
export * from './storage.js';
export * from './schema.js';
export * from './challenge.js';

// Export serviceStatus from database (since it's defined there)
export { serviceStatus } from './database.js';
