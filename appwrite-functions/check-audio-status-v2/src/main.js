/**
 * Check Audio Status Function V2
 * Checks the status of audio generation tasks and updates songs when complete
 * 
 * POST body format:
 * { taskId: "task_id_here", songId: "song_id_here" }
 * 
 * Can also be called without songId to just check status
 */
import AppwriteService from './appwrite.js';
import MurekaService from './mureka.js';
import { throwIfMissing, getStaticFile } from './utils.js';

// Constants
const DATABASE_ID = 'mitchly-music-db';
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
    throwIfMissing(process.env, ['MUREKA_API_KEY']);

    // Parse request body
    const body = req.bodyJson || {};
    const { taskId, songId } = body;
    
    if (!taskId) {
      return res.json({ 
        success: false, 
        error: 'Missing required field: taskId' 
      }, 400);
    }

    log(`Checking audio status for task: ${taskId}`);
    if (songId) {
      log(`Associated song ID: ${songId}`);
    }
    
    // Initialize Mureka service
    const mureka = new MurekaService();
    
    // Check status with Mureka
    const status = await mureka.checkStatus(taskId);
    
    log(`Task status: ${status.status}, Progress: ${status.progress}%`);
    
    // If we have a songId and the audio is complete, update the song
    // Check for both 'completed' and 'succeeded' status (Mureka may use either)
    if (songId && (status.status === 'completed' || status.status === 'succeeded') && status.audioUrl) {
      try {
        const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
        
        await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
          audioUrl: status.audioUrl,
          audioDuration: status.duration,
          status: 'audio_complete',
          audioGenerationCompletedAt: new Date().toISOString()
        });
        
        log(`Updated song ${songId} with audio URL`);
      } catch (updateErr) {
        error(`Failed to update song: ${updateErr.message}`);
        // Continue - we still want to return the status
      }
    }
    
    // If failed, update song status
    if (songId && status.status === 'failed') {
      try {
        const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
        
        await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
          status: 'audio_failed'
        });
        
        log(`Updated song ${songId} with failed status`);
      } catch (updateErr) {
        error(`Failed to update song status: ${updateErr.message}`);
      }
    }
    
    return res.json({
      success: true,
      taskId: taskId,
      status: status.status,
      progress: status.progress,
      audioUrl: status.audioUrl,
      duration: status.duration,
      error: status.error
    });
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};