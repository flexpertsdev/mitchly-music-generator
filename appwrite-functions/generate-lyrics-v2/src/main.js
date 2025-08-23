/**
 * Generate Lyrics Function V2
 * Supports both direct POST requests and database event triggers
 * 
 * POST body format:
 * { songId: "song_id_here" }
 * 
 * Database event format:
 * Triggered when song.status = 'generating_lyrics'
 */
import AppwriteService from './appwrite.js';
import AnthropicService from './anthropic.js';
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
    throwIfMissing(process.env, ['ANTHROPIC_API_KEY']);

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

    log(`Generating lyrics for song: ${songId}`);
    log(`Trigger type: ${isDirectCall ? 'Direct POST' : 'Database event'}`);
    
    // Initialize services
    const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
    const anthropic = new AnthropicService();
    
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
    if (!songData.title) {
      throw new Error('Song must have a title');
    }
    
    log(`Song title: ${songData.title}`);
    
    // Check if lyrics already exist
    if (songData.lyrics && songData.lyrics.trim()) {
      log('Song already has lyrics, skipping generation');
      return res.json({
        success: true,
        songId: songId,
        message: 'Song already has lyrics',
        hasLyrics: true
      });
    }
    
    // Get band profile if available
    let bandProfile = null;
    if (songData.bandId) {
      try {
        const band = await appwrite.getBand(DATABASE_ID, BANDS_COLLECTION, songData.bandId);
        if (band && band.profileData) {
          // Parse the JSON string if needed
          bandProfile = typeof band.profileData === 'string' 
            ? JSON.parse(band.profileData) 
            : band.profileData;
          log(`Found band: ${bandProfile.bandName || band.bandName}`);
        }
      } catch (e) {
        log(`Could not fetch band profile: ${e.message}`);
        // Continue without band profile
      }
    }
    
    // Update status to generating
    await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
      status: 'generating_lyrics'
    });
    
    // Generate lyrics
    log('Generating lyrics with Anthropic...');
    const result = await anthropic.generateLyrics({
      bandProfile,
      songDetails: {
        title: songData.title,
        trackNumber: songData.trackNumber || 1,
        description: songData.description || '',
        aiInstructions: songData.aiInstructions || '',
        artistDescription: songData.artistDescription || ''
      }
    });
    
    log(`Generated lyrics with ${result.lyrics.split('\n').length} lines`);
    
    // Update song with generated lyrics
    await appwrite.updateSong(DATABASE_ID, SONGS_COLLECTION, songId, {
      lyrics: result.lyrics,
      songDescription: result.songDescription,
      status: 'lyrics_complete'
    });
    
    log('Successfully generated and saved lyrics');
    
    return res.json({
      success: true,
      songId: songId,
      message: 'Lyrics generated successfully',
      preview: result.lyrics.substring(0, 100) + '...'
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
          status: 'lyrics_failed'
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