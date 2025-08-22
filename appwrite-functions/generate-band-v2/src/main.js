/**
 * Generate Band Function V2
 * Executable function that accepts POST requests with a text prompt
 */
import AppwriteService from './appwrite.js';
import AnthropicService from './anthropic.js';
import FalService from './fal.js';
import { throwIfMissing, generateVisualPrompts, getStaticFile } from './utils.js';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const ALBUMS_COLLECTION = 'albums';
const SONGS_COLLECTION = 'songs';

export default async ({ req, res, log, error }) => {
  // Handle GET requests - show test interface
  if (req.method === 'GET') {
    const html = getStaticFile('index.html');
    return res.text(html, 200, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    // Validate required environment variables
    throwIfMissing(process.env, ['ANTHROPIC_API_KEY']);

    // Parse request body
    const { prompt, userId } = req.bodyJson || {};
    
    if (!prompt) {
      return res.json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      }, 400);
    }

    // Get user ID from header if not in body
    const bandUserId = userId || req.headers['x-appwrite-user-id'] || 'anonymous';
    
    log(`Generating band for user: ${bandUserId}`);
    log(`Prompt: ${prompt}`);
    
    // Initialize services
    const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
    const anthropic = new AnthropicService();
    const fal = new FalService();
    
    // Create initial band document with all required fields based on schema
    const bandData = await appwrite.createBand(DATABASE_ID, BANDS_COLLECTION, {
      userId: bandUserId,
      bandName: 'Generating...',
      status: 'generating',
      userPrompt: prompt,
      createdBy: bandUserId,
      primaryGenre: '',
      profileData: '',
      albumTitle: '',
      albumDescription: '',
      trackCount: 0
    });
    
    const bandId = bandData.$id;
    log(`Created band with ID: ${bandId}`);
    
    try {
      // Generate band profile
      log('Generating band profile...');
      const bandProfile = await anthropic.generateBandProfile(prompt);
      
      // Normalize AI description
      bandProfile.aiDescription = anthropic.normalizeAiDescription(bandProfile);
      
      // Generate visual prompts
      const visualPrompts = generateVisualPrompts(bandProfile);
      
      // Update band with profile data
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        bandName: bandProfile.bandName,
        primaryGenre: bandProfile.primaryGenre,
        profileData: JSON.stringify(bandProfile),
        origin: bandProfile.origin || '',
        formationYear: bandProfile.formationYear || new Date().getFullYear(),
        aiInstructions: bandProfile.bandAiInstructions || '',
        logoPrompt: visualPrompts.logo,
        bandPhotoPrompt: visualPrompts.bandPhoto,
        albumTitle: bandProfile.albumConcept.title,
        albumDescription: bandProfile.albumConcept.description,
        trackCount: bandProfile.trackListing.length
      });
      
      log('Band profile saved');
      
      // Create album
      const album = await appwrite.createAlbum(DATABASE_ID, ALBUMS_COLLECTION, {
        bandId: bandId,
        title: bandProfile.albumConcept.title,
        description: bandProfile.albumConcept.description,
        concept: bandProfile.albumConcept.narrative || '',
        trackCount: bandProfile.trackListing.length,
        aiInstructions: bandProfile.albumAiInstructions || '',
        status: 'draft',
        coverPrompt: visualPrompts.albumCover,
        releaseYear: new Date().getFullYear(),
        userPrompt: prompt,
        conceptData: JSON.stringify(bandProfile.albumConcept)
      });
      
      log(`Album created: ${album.$id}`);
      
      // Create song stubs with all required fields
      const songPromises = bandProfile.trackListing.map((track, index) => 
        appwrite.createSong(DATABASE_ID, SONGS_COLLECTION, {
          bandId: bandId,
          albumId: album.$id,
          title: track.title,
          trackNumber: index + 1,
          description: track.description || '',
          lyrics: '', // Required field, will be filled later
          status: 'pending',
          artistDescription: bandProfile.aiDescription,
          aiInstructions: `Theme: ${track.theme}. ${track.description}`,
          audioStatus: 'pending',
          checkAttempts: 0,
          totalCheckAttempts: 0
        })
      );
      
      const songs = await Promise.all(songPromises);
      log(`Created ${songs.length} songs`);
      
      // Generate visual assets
      let visualAssets = {
        logoUrl: '',
        albumCoverUrl: '',
        bandPhotoUrl: ''
      };
      
      if (fal.isConfigured()) {
        log('Generating visual assets...');
        visualAssets = await fal.generateBandVisuals(visualPrompts);
        log('Visual assets generated');
      } else {
        log('FAL_API_KEY not configured, skipping image generation');
      }
      
      // Update band with final data
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        logoUrl: visualAssets.logoUrl,
        imageUrl: visualAssets.bandPhotoUrl, // Also save to imageUrl field
        albumCoverUrl: visualAssets.albumCoverUrl,
        bandPhotoUrl: visualAssets.bandPhotoUrl,
        status: 'published'
      });
      
      // Update album cover if available
      if (visualAssets.albumCoverUrl) {
        await appwrite.updateAlbum(DATABASE_ID, ALBUMS_COLLECTION, album.$id, {
          coverUrl: visualAssets.albumCoverUrl,
          status: 'completed'
        });
      }
      
      log('Band generation completed');
      
      return res.json({
        success: true,
        bandId: bandId,
        bandName: bandProfile.bandName,
        albumId: album.$id,
        albumTitle: bandProfile.albumConcept.title,
        songCount: bandProfile.trackListing.length,
        visualAssets: visualAssets,
        message: 'Band generation completed successfully'
      });
      
    } catch (genError) {
      // Update band status to failed
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        status: 'failed',
        generationError: genError.message
      });
      throw genError;
    }
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
