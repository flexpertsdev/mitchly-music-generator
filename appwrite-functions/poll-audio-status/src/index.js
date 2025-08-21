/**
 * Poll Audio Status Function
 * Runs on a schedule to check Mureka task status
 * 
 * This function:
 * 1. Finds all songs with status 'processing'
 * 2. Checks their Mureka task status
 * 3. Updates songs when audio is ready
 * 4. Downloads and stores the audio URL
 */
import { Client, Databases, Query } from 'node-appwrite';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const SONGS_COLLECTION = 'songs';
const MUREKA_STATUS_URL = 'https://api.mureka.ai/v2/music/status';

export default async ({ req, res, log, error }) => {
  try {
    log('Starting audio status polling...');
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Find all songs with audioStatus 'processing'
    const processingSongs = await databases.listDocuments(
      DATABASE_ID,
      SONGS_COLLECTION,
      [
        Query.equal('audioStatus', 'processing'),
        Query.isNotNull('murekaTaskId'),
        Query.limit(25) // Process up to 25 songs per run
      ]
    );
    
    log(`Found ${processingSongs.total} songs to check`);
    
    if (processingSongs.total === 0) {
      return res.json({
        success: true,
        message: 'No songs to process'
      });
    }
    
    const results = {
      completed: 0,
      failed: 0,
      stillProcessing: 0
    };
    
    // Check each song's status
    for (const song of processingSongs.documents) {
      try {
        log(`Checking status for song ${song.$id} (${song.title})`);
        
        // Call Mureka status API
        const statusResponse = await fetch(`${MUREKA_STATUS_URL}/${song.murekaTaskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${req.variables.MUREKA_API_KEY}`
          }
        });
        
        if (!statusResponse.ok) {
          throw new Error(`Mureka API error: ${statusResponse.status}`);
        }
        
        const statusData = await statusResponse.json();
        log(`Task ${song.murekaTaskId} status: ${statusData.status}`);
        
        // Handle different statuses
        switch (statusData.status) {
          case 'completed':
          case 'success':
            // Audio is ready!
            if (statusData.audio_url || statusData.download_url) {
              await databases.updateDocument(
                DATABASE_ID,
                SONGS_COLLECTION,
                song.$id,
                {
                  audioStatus: 'completed',
                  audioUrl: statusData.audio_url || statusData.download_url,
                  audioDuration: statusData.duration || null,
                  audioGeneratedAt: new Date().toISOString()
                }
              );
              results.completed++;
              log(`Song ${song.$id} audio completed`);
            } else {
              throw new Error('Completed but no audio URL provided');
            }
            break;
            
          case 'failed':
          case 'error':
            // Task failed
            await databases.updateDocument(
              DATABASE_ID,
              SONGS_COLLECTION,
              song.$id,
              {
                audioStatus: 'failed',
                audioError: statusData.error || 'Unknown error from Mureka'
              }
            );
            results.failed++;
            log(`Song ${song.$id} audio failed: ${statusData.error}`);
            break;
            
          case 'pending':
          case 'processing':
          case 'queued':
            // Still processing - check if it's been too long
            const startTime = new Date(song.audioGenerationStartedAt);
            const now = new Date();
            const minutesElapsed = (now - startTime) / (1000 * 60);
            
            if (minutesElapsed > 30) {
              // Timeout after 30 minutes
              await databases.updateDocument(
                DATABASE_ID,
                SONGS_COLLECTION,
                song.$id,
                {
                  audioStatus: 'failed',
                  audioError: 'Generation timeout - took longer than 30 minutes'
                }
              );
              results.failed++;
              log(`Song ${song.$id} timed out`);
            } else {
              results.stillProcessing++;
              log(`Song ${song.$id} still processing (${Math.round(minutesElapsed)} minutes elapsed)`);
            }
            break;
            
          default:
            log(`Unknown status for song ${song.$id}: ${statusData.status}`);
            results.stillProcessing++;
        }
        
      } catch (songError) {
        error(`Error checking song ${song.$id}: ${songError.message}`);
        
        // Update song with error
        try {
          await databases.updateDocument(
            DATABASE_ID,
            SONGS_COLLECTION,
            song.$id,
            {
              audioStatus: 'failed',
              audioError: songError.message
            }
          );
          results.failed++;
        } catch (updateError) {
          error(`Failed to update song error status: ${updateError.message}`);
        }
      }
    }
    
    log(`Polling complete - Completed: ${results.completed}, Failed: ${results.failed}, Still Processing: ${results.stillProcessing}`);
    
    return res.json({
      success: true,
      results: results,
      message: `Processed ${processingSongs.total} songs`
    });
    
  } catch (err) {
    error('Error in audio status polling:', err.message);
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};