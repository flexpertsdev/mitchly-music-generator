/**
 * Generate Audio Function
 * Triggered when a song document is updated with audioStatus 'generating'
 * 
 * This function:
 * 1. Sends song data to Mureka API for audio generation
 * 2. Stores the task ID for polling
 * 3. Updates song with task information
 */
import { Client, Databases } from 'node-appwrite';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const SONGS_COLLECTION = 'songs';
const MUREKA_API_URL = 'https://api.mureka.ai/v2/music/generate';

export default async ({ req, res, log, error }) => {
  try {
    // Parse the event data
    const event = req.body;
    
    // Check if this is a song update event
    if (!event.$id || event.$collection !== SONGS_COLLECTION) {
      return res.json({ success: false, message: 'Not a song update event' });
    }
    
    // Only process if audioStatus changed to 'generating'
    if (event.audioStatus !== 'generating') {
      return res.json({ success: false, message: 'Not generating audio status' });
    }
    
    const songId = event.$id;
    log(`Starting audio generation for song: ${songId}`);
    
    // Validate required fields
    if (!event.lyrics) {
      throw new Error('Song must have lyrics before generating audio');
    }
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Prepare Mureka API request
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
    
    // Call Mureka API
    const murekaResponse = await fetch(MUREKA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.variables.MUREKA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(murekaPayload)
    });
    
    if (!murekaResponse.ok) {
      const errorText = await murekaResponse.text();
      throw new Error(`Mureka API error: ${murekaResponse.status} - ${errorText}`);
    }
    
    const murekaData = await murekaResponse.json();
    log(`Mureka task created: ${murekaData.task_id}`);
    
    // Update song with task information
    await databases.updateDocument(
      DATABASE_ID,
      SONGS_COLLECTION,
      songId,
      {
        audioStatus: 'processing',
        murekaTaskId: murekaData.task_id,
        audioGenerationStartedAt: new Date().toISOString()
      }
    );
    
    log('Song updated with Mureka task ID');
    
    return res.json({
      success: true,
      songId: songId,
      taskId: murekaData.task_id,
      message: 'Audio generation started successfully'
    });
    
  } catch (err) {
    error('Error generating audio:', err.message);
    
    // Try to update the document with error status
    if (req.body?.$id) {
      try {
        const client = new Client()
          .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
          .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
          .setKey(req.variables.APPWRITE_API_KEY);
        
        const databases = new Databases(client);
        
        await databases.updateDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          req.body.$id,
          {
            audioStatus: 'failed',
            audioError: err.message || 'Unknown error'
          }
        );
      } catch (updateErr) {
        error('Failed to update error status:', updateErr.message);
      }
    }
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};