/**
 * Generate Audio Function V2
 * Supports both direct POST requests and database event triggers
 * 
 * POST body format:
 * { songId: "song_id_here" }
 * 
 * Database event format:
 * Triggered when song.status = 'generating_audio'
 */
import AppwriteService from './appwrite.js';
import MurekaService from './mureka.js';
import { throwIfMissing, getStaticFile } from './utils.js';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const SONGS_COLLECTION = 'songs';
const BANDS_COLLECTION = 'bands';

export default async ({ req, res, log, error }) => {
  // Handle GET requests - show test interface
  if (req.method === 'GET') {
    const html = getStaticFile('index.html');
    return res.text(html, 200, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  // Handle POST requests and database events
  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    // Validate required environment variables
    throwIfMissing(process.env, ['MUREKA_API_KEY']);

    // Parse request body
    const body = req.bodyJson || {};
    
    // Determine if this is a direct call or database event
    const isDirectCall = !body.$id; // Database events have $id
    const songId = isDirectCall ? body.songId : body.$id;
    
    if (!songId) {
      return res.json({ 
        success: false, 
        error: 'Missing required field: songId' 
      }, 400);
    }

    log(`Generating audio for song: ${songId}`);
    log(`Trigger type: ${isDirectCall ? 'Direct POST' : 'Database event'}`);
    
    // Initialize services
    const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
    const mureka = new MurekaService();
    
    // Get song details
    let songData;
    if (isDirectCall) {
      // For direct calls, fetch the song
      songData = await appwrite.getSong(DATABASE_ID, SONGS_COLLECTION, songId);
    } else {
      // For database events, use the event data
      songData = body;
    }
    
    // Validate song has required fields
    if (!songData.title || !songData.lyrics) {
      throw new Error('Song must have title and lyrics before generating audio');
    }
    
    log(`Song title: ${songData.title}`);
    
    // Check if audio already exists
    if (songData.audioUrl && songData.audioUrl.trim()) {
      log('Song already has audio, skipping generation');
      return res.json({
        success: true,
        songId: songId,
        message: 'Song already has audio',
        hasAudio: true,
        audioUrl: songData.audioUrl
      });
    }
    
    // Get band profile if available for style context
    let bandProfile = null;
    let genre = 'Alternative Rock';
    let style = 'Dynamic and energetic';
    
    if (songData.bandId) {
      try {
        const band = await appwrite.getBand(DATABASE_ID, BANDS_COLLECTION, songData.bandId);
        if (band && band.profileData) {
          // Parse the JSON string if needed
          bandProfile = typeof band.profileData === 'string' 
            ? JSON.parse(band.profileData) 
            : band.profileData;
          
          genre = bandProfile.primaryGenre || genre;
          style = bandProfile.coreSound || style;
          log(`Found band: ${bandProfile.bandName || band.bandName}, Genre: ${genre}`);
        }
      } catch (e) {
        log(`Could not fetch band profile: ${e.message}`);
        // Continue without band profile
      }
    }
    
    // Update status to generating
    await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
      status: 'generating_audio'
    });
    
    // Prepare generation parameters
    const generationParams = {
      title: songData.title,
      lyrics: songData.lyrics,
      description: songData.songDescription || `${genre} song with ${style}`,
      artistDescription: songData.artistDescription || `${genre} band with ${style}`,
      genre: genre,
      style: style
    };
    
    // Generate audio
    log('Generating audio with Mureka...');
    const result = await mureka.generateAudio(generationParams);
    
    log(`Audio generation started, task ID: ${result.taskId}`);
    
    // Update song with generation task ID
    await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
      audioGenerationTaskId: result.taskId,
      status: 'audio_processing',
      audioGenerationStartedAt: new Date().toISOString()
    });
    
    // If direct call, we can optionally wait for completion (with timeout)
    if (isDirectCall && body.waitForCompletion) {
      log('Waiting for audio generation to complete...');
      const maxWaitTime = 30000; // 30 seconds max wait
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const status = await mureka.checkStatus(result.taskId);
        
        if (status.status === 'completed' && status.audioUrl) {
          // Update song with final audio URL
          await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
            audioUrl: status.audioUrl,
            audioDuration: status.duration,
            status: 'audio_complete',
            audioGenerationCompletedAt: new Date().toISOString()
          });
          
          return res.json({
            success: true,
            songId: songId,
            message: 'Audio generated successfully',
            audioUrl: status.audioUrl,
            duration: status.duration
          });
        } else if (status.status === 'failed') {
          throw new Error(`Audio generation failed: ${status.error || 'Unknown error'}`);
        }
      }
      
      // Timeout reached, return processing status
      log('Audio generation still processing, returning task ID');
    }
    
    log('Audio generation initiated successfully');
    
    return res.json({
      success: true,
      songId: songId,
      message: 'Audio generation started',
      taskId: result.taskId,
      status: 'processing'
    });
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    // Try to update song status to failed if we have a songId
    try {
      const songId = req.bodyJson?.songId || req.bodyJson?.$id;
      if (songId) {
        const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
        await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
          status: 'audio_failed'
        });
      }
    } catch (updateErr) {
      error(`Failed to update song status: ${updateErr.message}`);
    }
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};