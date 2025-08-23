/**
 * Generate Audio Function
 * Can be triggered by:
 * 1. Direct HTTP POST with songId
 * 2. Database event when audioStatus = 'generating'
 * 
 * This function:
 * 1. Validates the event and environment
 * 2. Sends song data to Mureka API for audio generation
 * 3. Stores the task ID for polling
 * 4. Updates song with task information
 */
import { MurekaService } from './services/MurekaService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { validateAudioEvent, validateEnvironment, parseRequestBody, prepareMurekaPayload } from './utils/validation.js';

export default async ({ req, res, log, error }) => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Parse and validate request
    const body = parseRequestBody(req.body);
    const validation = validateAudioEvent(body);
    
    log(`Starting audio generation for song: ${validation.songId}`);
    log(`Trigger type: ${validation.isDirectCall ? 'Direct HTTP' : 'Database event'}`);
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1',
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const mureka = new MurekaService(process.env.MUREKA_API_KEY);
    
    // Get song details
    let songData;
    if (validation.isDirectCall) {
      // For direct calls, fetch the song
      songData = await appwrite.getSong(validation.songId);
      
      // Validate that song has lyrics
      if (!songData.lyrics) {
        throw new Error('Song must have lyrics before generating audio');
      }
      
      // Update status to generating
      await appwrite.updateSongAudioStatus(validation.songId, 'generating');
    } else {
      // For database events, use the event data
      songData = body;
    }
    
    // Get band data if available
    let bandData = null;
    if (songData.bandId) {
      try {
        bandData = await appwrite.getBand(songData.bandId);
        if (bandData) {
          log(`Found band: ${bandData.bandName}`);
        }
      } catch (e) {
        log(`Could not fetch band: ${e.message}`);
        // Continue without band data
      }
    }
    
    // Prepare Mureka payload
    const murekaPayload = prepareMurekaPayload(songData, bandData);
    
    log('Calling Mureka API...');
    log(`Title: ${murekaPayload.title}`);
    log(`Artist: ${murekaPayload.artist_description}`);
    log(`Lyrics length: ${murekaPayload.lyrics.length} characters`);
    
    // Generate music
    const murekaData = await mureka.generateMusic(murekaPayload);
    log(`Mureka task created: ${murekaData.task_id}`);
    
    // Update song with task information
    await appwrite.updateSongAudioStatus(
      validation.songId,
      'processing',
      murekaData.task_id
    );
    
    log('Song updated with Mureka task ID');
    
    return res.json({
      success: true,
      songId: validation.songId,
      taskId: murekaData.task_id,
      message: 'Audio generation started successfully'
    });
    
  } catch (err) {
    error(`Error generating audio: ${err.message}`);
    
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
        
        await appwrite.updateSongAudioStatus(
          songId,
          'failed',
          null,
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
