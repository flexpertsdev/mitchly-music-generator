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
import { MurekaService } from './services/MurekaService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { shouldSkipSong, isTimeout, sleep } from './utils/helpers.js';
import { POLLING_CONFIG } from './config.js';

export default async ({ req, res, log, error }) => {
  try {
    log('Starting audio status polling...');
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const mureka = new MurekaService(process.env.MUREKA_API_KEY);
    
    // Get processing songs
    const processingSongs = await appwrite.getProcessingSongs();
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
      stillProcessing: 0,
      skipped: 0
    };
    
    // Process each song
    for (const song of processingSongs.documents) {
      try {
        // Skip if checked too recently
        if (shouldSkipSong(song)) {
          log(`Skipping song ${song.$id} - checked too recently`);
          results.skipped++;
          continue;
        }
        
        log(`Checking status for song ${song.$id} (${song.title})`);
        
        // Update last check time
        await appwrite.updateSongStatusCheck(song.$id, song.checkAttempts || 0);
        
        // Check task status
        const statusData = await mureka.checkStatus(song.murekaTaskId);
        log(`Task ${song.murekaTaskId} status: ${statusData.status}`);
        
        // Handle different statuses
        switch (statusData.status) {
          case 'completed':
          case 'success':
            if (statusData.audio_url || statusData.download_url) {
              await appwrite.updateSongAudioCompleted(
                song.$id,
                statusData.audio_url || statusData.download_url,
                statusData.duration,
                song.checkAttempts || 0
              );
              results.completed++;
              log(`Song ${song.$id} audio completed`);
            } else {
              throw new Error('Completed but no audio URL provided');
            }
            break;
            
          case 'failed':
          case 'error':
            await appwrite.updateSongAudioFailed(
              song.$id,
              statusData.error || 'Unknown error from Mureka'
            );
            results.failed++;
            log(`Song ${song.$id} audio failed: ${statusData.error}`);
            break;
            
          case 'pending':
          case 'processing':
          case 'queued':
            if (isTimeout(song)) {
              await appwrite.updateSongAudioFailed(
                song.$id,
                'Generation timeout - took longer than 30 minutes'
              );
              results.failed++;
              log(`Song ${song.$id} timed out`);
            } else {
              results.stillProcessing++;
              const startTime = new Date(song.audioGenerationStartedAt);
              const minutesElapsed = Math.round((Date.now() - startTime) / (1000 * 60));
              log(`Song ${song.$id} still processing (${minutesElapsed} minutes elapsed)`);
            }
            break;
            
          default:
            log(`Unknown status for song ${song.$id}: ${statusData.status}`);
            results.stillProcessing++;
        }
        
        // Add delay between API calls
        if (processingSongs.documents.indexOf(song) < processingSongs.documents.length - 1) {
          await sleep(POLLING_CONFIG.API_CALL_DELAY);
        }
        
      } catch (songError) {
        error(`Error checking song ${song.$id}: ${songError.message}`);
        
        try {
          await appwrite.updateSongAudioFailed(song.$id, songError.message);
          results.failed++;
        } catch (updateError) {
          error(`Failed to update song error status: ${updateError.message}`);
        }
      }
    }
    
    log(`Polling complete - Completed: ${results.completed}, Failed: ${results.failed}, Still Processing: ${results.stillProcessing}, Skipped: ${results.skipped}`);
    
    return res.json({
      success: true,
      results: results,
      totalFound: processingSongs.total,
      totalProcessed: results.completed + results.failed + results.stillProcessing,
      message: `Processed ${results.completed + results.failed + results.stillProcessing} songs out of ${processingSongs.total} found`
    });
    
  } catch (err) {
    error(`Error in audio status polling: ${err.message}`);
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};
