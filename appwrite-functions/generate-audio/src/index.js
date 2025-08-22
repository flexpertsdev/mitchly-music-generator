/**
 * Generate Audio Function
 * Triggered when a song document is updated with audioStatus 'generating'
 * 
 * This function:
 * 1. Validates the event and environment
 * 2. Sends song data to Mureka API for audio generation
 * 3. Stores the task ID for polling
 * 4. Updates song with task information
 */
import { MurekaService } from './services/MurekaService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { validateAudioEvent, validateEnvironment } from './utils/validation.js';

export default async ({ req, res, log, error }) => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Parse and validate event
    const event = req.body;
    validateAudioEvent(event);
    
    const songId = event.$id;
    log(`Starting audio generation for song: ${songId}`);
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const mureka = new MurekaService(process.env.MUREKA_API_KEY);
    
    // Prepare Mureka payload
    const murekaPayload = {
      title: event.title || 'Untitled',
      lyrics: event.lyrics,
      artist_description: event.artistDescription || 'Modern band with unique sound',
      song_description: event.description || 'Original composition',
      // Optional parameters
      make_instrumental: false,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.95
    };
    
    log('Calling Mureka API...');
    
    // Generate music
    const murekaData = await mureka.generateMusic(murekaPayload);
    log(`Mureka task created: ${murekaData.task_id}`);
    
    // Update song with task information
    await appwrite.updateSongAudioStatus(
      songId,
      'processing',
      murekaData.task_id
    );
    
    log('Song updated with Mureka task ID');
    
    return res.json({
      success: true,
      songId: songId,
      taskId: murekaData.task_id,
      message: 'Audio generation started successfully'
    });
    
  } catch (err) {
    error(`Error generating audio: ${err.message}`);
    
    // Try to update song status to failed
    if (req.body?.$id) {
      try {
        const appwrite = new AppwriteService(
          process.env.APPWRITE_FUNCTION_API_ENDPOINT,
          process.env.APPWRITE_FUNCTION_PROJECT_ID,
          req.headers['x-appwrite-key']
        );
        
        await appwrite.updateSongAudioStatus(
          req.body.$id,
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
    });
  }
};
