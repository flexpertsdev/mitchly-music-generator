/**
 * Poll Audio Status Function
 * Can be triggered by:
 * 1. Schedule (runs every 2 minutes by default)
 * 2. Direct HTTP POST with optional songId or forceCheck
 * 
 * This function:
 * 1. Finds all songs with status 'processing'
 * 2. Checks their Mureka task status
 * 3. Updates songs when audio is ready
 * 4. Downloads and stores the audio URL
 */
import { MurekaService } from './services/MurekaService.js';
import { AppwriteService } from './services/AppwriteService.js';
import { 
  shouldSkipSong, 
  isTimeout, 
  sleep, 
  getStatusCategory,
  parseRequestBody,
  validateEnvironment
} from './utils/helpers.js';
import { POLLING_CONFIG } from './config.js';

export default async ({ req, res, log, error }) => {
  try {
    // Validate environment
    validateEnvironment();
    
    log('Starting audio status polling...');
    
    // Parse request body for manual triggers
    const body = parseRequestBody(req.body);
    const forceCheck = body.forceCheck || false;
    const specificSongId = body.songId;
    
    // Initialize services
    const appwrite = new AppwriteService(
      process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1',
      process.env.APPWRITE_FUNCTION_PROJECT_ID,
      req.headers['x-appwrite-key']
    );
    
    const mureka = new MurekaService(process.env.MUREKA_API_KEY);
    
    let songsToCheck;
    
    // Handle specific song check
    if (specificSongId) {
      log(`Checking specific song: ${specificSongId}`);
      try {
        const song = await appwrite.getSong(specificSongId);
        
        if (!song.murekaTaskId) {
          return res.json({
            success: false,
            error: 'Song does not have a Mureka task ID'
          });
        }
        
        songsToCheck = {
          documents: [song],
          total: 1
        };
      } catch (err) {
        return res.json({
          success: false,
          error: `Failed to fetch song: ${err.message}`
        });
      }
    } else {
      // Get all processing songs
      songsToCheck = await appwrite.getProcessingSongs(forceCheck);
      log(`Found ${songsToCheck.total} songs to check`);
    }
    
    if (songsToCheck.total === 0) {
      return res.json({
        success: true,
        message: 'No songs to process'
      });
    }
    
    const results = {
      completed: 0,
      failed: 0,
      stillProcessing: 0,
      skipped: 0,
      errors: []
    };
    
    // Process songs in batches to avoid overwhelming the API
    const songs = songsToCheck.documents;
    
    for (let i = 0; i < songs.length; i += POLLING_CONFIG.BATCH_SIZE) {
      const batch = songs.slice(i, i + POLLING_CONFIG.BATCH_SIZE);
      
      await Promise.all(batch.map(async (song) => {
        try {
          // Skip if checked too recently (unless forced)
          if (shouldSkipSong(song, forceCheck)) {
            log(`Skipping song ${song.$id} - checked too recently`);
            results.skipped++;
            return;
          }
          
          log(`Checking status for song ${song.$id} (${song.title})`);
          
          // Update last check time
          await appwrite.updateSongStatusCheck(song.$id, song.checkAttempts || 0);
          
          // Check task status
          const statusData = await mureka.checkStatus(song.murekaTaskId);
          const statusCategory = getStatusCategory(statusData.status);
          
          log(`Task ${song.murekaTaskId} status: ${statusData.status} (${statusCategory})`);
          
          // Handle different statuses
          switch (statusCategory) {
            case 'completed':
              if (statusData.audio_url) {
                await appwrite.updateSongAudioCompleted(
                  song.$id,
                  statusData.audio_url,
                  statusData.duration,
                  song.checkAttempts || 0
                );
                results.completed++;
                log(`✅ Song ${song.$id} audio completed`);
              } else {
                throw new Error('Completed but no audio URL provided');
              }
              break;
              
            case 'failed':
              await appwrite.updateSongAudioFailed(
                song.$id,
                statusData.error || 'Unknown error from Mureka'
              );
              results.failed++;
              log(`❌ Song ${song.$id} audio failed: ${statusData.error}`);
              break;
              
            case 'processing':
              if (isTimeout(song)) {
                await appwrite.updateSongAudioFailed(
                  song.$id,
                  'Generation timeout - took longer than 30 minutes'
                );
                results.failed++;
                log(`⏱️ Song ${song.$id} timed out`);
              } else {
                results.stillProcessing++;
                const startTime = new Date(song.audioGenerationStartedAt);
                const minutesElapsed = Math.round((Date.now() - startTime) / (1000 * 60));
                log(`⏳ Song ${song.$id} still processing (${minutesElapsed} minutes elapsed)`);
              }
              break;
              
            default:
              log(`⚠️ Unknown status for song ${song.$id}: ${statusData.status}`);
              results.stillProcessing++;
          }
          
        } catch (songError) {
          error(`Error checking song ${song.$id}: ${songError.message}`);
          results.errors.push({
            songId: song.$id,
            error: songError.message
          });
          
          try {
            await appwrite.updateSongAudioFailed(song.$id, songError.message);
            results.failed++;
          } catch (updateError) {
            error(`Failed to update song error status: ${updateError.message}`);
          }
        }
      }));
      
      // Add delay between batches
      if (i + POLLING_CONFIG.BATCH_SIZE < songs.length) {
        await sleep(POLLING_CONFIG.API_CALL_DELAY * 2);
      }
    }
    
    const summary = `Completed: ${results.completed}, Failed: ${results.failed}, Still Processing: ${results.stillProcessing}, Skipped: ${results.skipped}`;
    log(`Polling complete - ${summary}`);
    
    return res.json({
      success: true,
      results: results,
      summary: summary,
      totalFound: songsToCheck.total,
      totalProcessed: results.completed + results.failed + results.stillProcessing,
      forceCheck: forceCheck,
      message: `Processed ${results.completed + results.failed + results.stillProcessing} songs out of ${songsToCheck.total} found`
    });
    
  } catch (err) {
    error(`Error in audio status polling: ${err.message}`);
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
