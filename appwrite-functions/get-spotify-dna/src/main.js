import { throwIfMissing, getEnvironmentVariable, interpolate } from './utils.js';
import { createAppwriteClient, DB_CONFIG } from './appwrite.js';
import { fetchSpotifyUserData, createMusicalDNA } from './spotify.js';
import { generateBandConcepts } from './anthropic.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get Spotify DNA Function
 * Analyzes user's Spotify listening history and generates personalized band concepts
 * @param {object} context - Appwrite function context
 * @returns {Promise<object>} Response object
 */
export default async ({ req, res, log, error }) => {
  // Handle GET request - serve test interface
  if (req.method === 'GET') {
    try {
      const html = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
      const interpolated = interpolate(html, {
        APPWRITE_FUNCTION_API_ENDPOINT: process.env.APPWRITE_FUNCTION_API_ENDPOINT || '',
        APPWRITE_FUNCTION_PROJECT_ID: process.env.APPWRITE_FUNCTION_PROJECT_ID || '',
        APPWRITE_FUNCTION_ID: process.env.APPWRITE_FUNCTION_ID || '',
        APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'mitchly-music-db',
        USER_PROFILES_COLLECTION: process.env.USER_PROFILES_COLLECTION || 'user_music_profiles',
        BAND_CONCEPTS_COLLECTION: process.env.BAND_CONCEPTS_COLLECTION || 'band_concepts'
      });
      return res.send(interpolated, 200, { 'Content-Type': 'text/html' });
    } catch (err) {
      log('Failed to load test interface');
      return res.send('Test interface not available', 200, { 'Content-Type': 'text/plain' });
    }
  }

  // Handle POST request - main function logic
  if (req.method === 'POST') {
    try {
      // Parse request body
      const body = JSON.parse(req.body || '{}');
      
      // Support both direct calls and database events
      const userId = body.userId || body.$id;
      const spotifyToken = body.spotifyToken || body.accessToken;
      const forceUpdate = body.forceUpdate || false;
      
      // Validate required fields
      if (!userId && !spotifyToken) {
        throw new Error('Either userId or spotifyToken is required');
      }

      log(`Processing Spotify DNA for ${userId ? `user ${userId}` : 'token-based request'}`);

      // Initialize Appwrite client
      const { databases, users } = createAppwriteClient();

      // Get Spotify access token
      let accessToken = spotifyToken;
      
      if (!accessToken && userId) {
        try {
          // Try to get from user preferences
          const user = await users.get(userId);
          accessToken = user.prefs?.spotify?.accessToken || user.prefs?.spotifyToken;
          
          if (!accessToken) {
            log('No Spotify token found in user preferences');
            return res.json({
              success: false,
              error: 'No Spotify authentication found. Please connect your Spotify account first.'
            }, 400);
          }
        } catch (userError) {
          log(`Failed to fetch user: ${userError.message}`);
          // Continue if we have a token from the request
          if (!spotifyToken) {
            throw new Error('Unable to fetch user data and no token provided');
          }
        }
      }

      // Check if profile already exists and if we should update
      if (userId && !forceUpdate) {
        try {
          const existingProfile = await databases.getDocument(
            DB_CONFIG.DATABASE_ID,
            DB_CONFIG.COLLECTIONS.USER_PROFILES,
            userId
          );
          
          // Check if profile is recent (less than 24 hours old)
          const lastUpdated = new Date(existingProfile.lastUpdated);
          const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate < 24) {
            log('Using cached Spotify DNA profile');
            return res.json({
              success: true,
              cached: true,
              musicalDNA: existingProfile.musicalDNA,
              bandConcepts: existingProfile.bandConcepts || [],
              lastUpdated: existingProfile.lastUpdated
            });
          }
        } catch (docError) {
          log('No existing profile found, creating new one');
        }
      }

      // Fetch Spotify data
      log('Fetching Spotify user data...');
      const spotifyData = await fetchSpotifyUserData(accessToken);
      
      // Create musical DNA profile
      log('Creating musical DNA profile...');
      const musicalDNA = createMusicalDNA(spotifyData);
      
      // Generate band concepts
      log('Generating personalized band concepts...');
      const bandConcepts = await generateBandConcepts(
        musicalDNA,
        getEnvironmentVariable('ANTHROPIC_API_KEY'),
        getEnvironmentVariable('FAL_API_KEY', null)
      );
      
      // Store in database if we have a userId
      if (userId) {
        try {
          // Store or update user profile
          const profileData = {
            userId: userId,
            spotifyProfile: spotifyData.profile,
            topTracks: spotifyData.topTracks,
            recentTracks: spotifyData.recentTracks,
            topArtists: spotifyData.topArtists,
            audioFeatures: spotifyData.audioFeatures,
            musicalDNA: musicalDNA,
            bandConcepts: bandConcepts.slice(0, 5), // Store top 5
            lastUpdated: new Date().toISOString(),
            onboardingComplete: true
          };

          try {
            // Try to update existing document
            await databases.updateDocument(
              DB_CONFIG.DATABASE_ID,
              DB_CONFIG.COLLECTIONS.USER_PROFILES,
              userId,
              profileData
            );
            log('Updated existing user profile');
          } catch (updateError) {
            // Create new document if update fails
            await databases.createDocument(
              DB_CONFIG.DATABASE_ID,
              DB_CONFIG.COLLECTIONS.USER_PROFILES,
              userId,
              profileData
            );
            log('Created new user profile');
          }

          // Store band concepts separately for easier querying
          const conceptsDoc = {
            userId: userId,
            concepts: bandConcepts,
            musicalDNA: musicalDNA.aiSummary,
            type: 'spotify_dna',
            createdAt: new Date().toISOString()
          };

          try {
            await databases.createDocument(
              DB_CONFIG.DATABASE_ID,
              DB_CONFIG.COLLECTIONS.BAND_CONCEPTS,
              `${userId}_spotify_${Date.now()}`,
              conceptsDoc
            );
            log('Stored band concepts');
          } catch (conceptError) {
            log(`Failed to store band concepts: ${conceptError.message}`);
            // Non-critical error, continue
          }
        } catch (dbError) {
          error(`Database error: ${dbError.message}`);
          // Continue - we can still return the data
        }
      }

      log('Successfully processed Spotify DNA');
      
      // Return success response
      return res.json({
        success: true,
        musicalDNA: musicalDNA,
        bandConcepts: bandConcepts.slice(0, 5), // Return top 5
        profile: {
          displayName: spotifyData.profile?.display_name,
          email: spotifyData.profile?.email,
          country: spotifyData.profile?.country,
          product: spotifyData.profile?.product
        },
        message: 'Spotify DNA analysis completed successfully'
      });
      
    } catch (err) {
      error(`Error processing request: ${err.message}`);
      
      // Return error response
      return res.json({
        success: false,
        error: err.message || 'Failed to process Spotify DNA'
      }, err.status || 500);
    }
  }

  // Method not allowed
  return res.json({
    success: false,
    error: 'Method not allowed'
  }, 405);
};