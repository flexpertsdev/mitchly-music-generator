/**
 * Generate Lyrics Function
 * Triggered when a song document is updated with status 'generating'
 * 
 * This function:
 * 1. Validates the event and environment
 * 2. Fetches band context
 * 3. Generates lyrics using Anthropic
 * 4. Updates song with generated lyrics
 */
import { AnthropicService } from './services/AnthropicService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { validateSongEvent, validateEnvironment } from './utils/validation.js';

export default async ({ req, res, log, error }) => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Parse and validate event
    const event = req.body;
    validateSongEvent(event);
    
    const songId = event.$id;
    log(`Starting lyrics generation for song: ${songId}`);
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const anthropic = new AnthropicService(process.env.ANTHROPIC_API_KEY);
    
    // Get band profile if available
    let bandProfile = null;
    if (event.bandId) {
      try {
        const band = await appwrite.getBand(event.bandId);
        bandProfile = band.profileData;
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
        title: event.title,
        trackNumber: event.trackNumber,
        description: event.description,
        aiInstructions: event.aiInstructions,
        primaryGenre: event.primaryGenre
      }
    });
    
    // Update song with generated lyrics
    await appwrite.updateSongWithLyrics(
      songId,
      result.lyrics,
      result.songDescription
    );
    
    log('Successfully generated and saved lyrics');
    
    return res.json({
      success: true,
      songId: songId,
      message: 'Lyrics generated successfully'
    });
    
  } catch (err) {
    error(`Error generating lyrics: ${err.message}`);
    
    // Try to update song status to failed
    if (req.body?.$id) {
      try {
        const appwrite = new AppwriteService(
          process.env.APPWRITE_FUNCTION_API_ENDPOINT,
          process.env.APPWRITE_FUNCTION_PROJECT_ID,
          req.headers['x-appwrite-key']
        );
        
        await appwrite.updateSongStatus(
          req.body.$id,
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
    });
  }
};
