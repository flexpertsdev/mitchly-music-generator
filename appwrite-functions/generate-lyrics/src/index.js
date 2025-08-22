/**
 * Generate Lyrics Function
 * Can be triggered by:
 * 1. Direct HTTP POST with songId
 * 2. Database event when song status = 'generating'
 * 
 * This function:
 * 1. Validates the event and environment
 * 2. Fetches band context
 * 3. Generates lyrics using Anthropic
 * 4. Updates song with generated lyrics
 */
import { AnthropicService } from './services/AnthropicService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { validateSongEvent, validateEnvironment, parseRequestBody } from './utils/validation.js';

export default async ({ req, res, log, error }) => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Parse and validate request
    const body = parseRequestBody(req.body);
    const validation = validateSongEvent(body);
    
    log(`Starting lyrics generation for song: ${validation.songId}`);
    log(`Trigger type: ${validation.isDirectCall ? 'Direct HTTP' : 'Database event'}`);
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1',
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const anthropic = new AnthropicService(process.env.ANTHROPIC_API_KEY);
    
    // Get song details
    let songData;
    if (validation.isDirectCall) {
      // For direct calls, fetch the song
      songData = await appwrite.getSong(validation.songId);
    } else {
      // For database events, use the event data
      songData = body;
    }
    
    // Validate song data
    if (!songData.title) {
      throw new Error('Song must have a title');
    }
    
    // Update status to generating
    if (validation.isDirectCall) {
      await appwrite.updateSongStatus(validation.songId, 'generating');
    }
    
    // Get band profile if available
    let bandProfile = null;
    if (songData.bandId) {
      try {
        const band = await appwrite.getBand(songData.bandId);
        if (band) {
          bandProfile = band.profileData;
          log(`Found band profile: ${band.bandName}`);
        }
      } catch (e) {
        log(`Could not fetch band profile: ${e.message}`);
        // Continue without band profile
      }
    }
    
    // Generate lyrics
    log('Generating lyrics with Anthropic...');
    const result = await anthropic.generateLyrics({
      bandProfile,
      songDetails: {
        title: songData.title,
        trackNumber: songData.trackNumber || '1',
        description: songData.description,
        aiInstructions: songData.aiInstructions,
        primaryGenre: songData.primaryGenre || bandProfile?.primaryGenre
      }
    });
    
    log(`Generated lyrics with ${result.lyrics.split('\n').length} lines`);
    
    // Update song with generated lyrics
    await appwrite.updateSongWithLyrics(
      validation.songId,
      result.lyrics,
      result.songDescription
    );
    
    log('Successfully generated and saved lyrics');
    
    return res.json({
      success: true,
      songId: validation.songId,
      message: 'Lyrics generated successfully',
      linesGenerated: result.lyrics.split('\n').length
    });
    
  } catch (err) {
    error(`Error generating lyrics: ${err.message}`);
    
    // Try to update song status to failed
    const body = parseRequestBody(req.body);
    const songId = body.songId || body.$id;
    
    if (songId) {
      try {
        const appwrite = new AppwriteService(
          process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1',
          process.env.APPWRITE_FUNCTION_PROJECT_ID,
          req.headers['x-appwrite-key']
        );
        
        await appwrite.updateSongStatus(
          songId,
          'failed',
          err.message
        );
      } catch (updateErr) {
        error(`Failed to update error status: ${updateErr.message}`);
      }
    }
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
