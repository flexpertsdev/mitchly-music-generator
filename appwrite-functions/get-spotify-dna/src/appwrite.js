/**
 * Appwrite client and database configuration
 */

import { Client, Databases, Functions, Storage, Users } from 'node-appwrite';

/**
 * Initialize Appwrite client
 * @param {string} apiKey - Optional API key override
 * @returns {object} Appwrite services
 */
export function createAppwriteClient(apiKey) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey || process.env.APPWRITE_FUNCTION_API_KEY);

  return {
    client,
    databases: new Databases(client),
    functions: new Functions(client),
    storage: new Storage(client),
    users: new Users(client)
  };
}

/**
 * Database configuration
 */
export const DB_CONFIG = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'mitchly-music-db',
  COLLECTIONS: {
    USER_PROFILES: process.env.USER_PROFILES_COLLECTION || 'user_music_profiles',
    BAND_CONCEPTS: process.env.BAND_CONCEPTS_COLLECTION || 'band_concepts',
    BANDS: process.env.BANDS_COLLECTION || 'bands',
    ALBUMS: process.env.ALBUMS_COLLECTION || 'albums',
    SONGS: process.env.SONGS_COLLECTION || 'songs'
  }
};