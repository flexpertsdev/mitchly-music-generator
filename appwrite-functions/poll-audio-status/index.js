import { Client, Databases, Functions } from 'node-appwrite';
import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
  try {
    // Parse the request data
    const { songId, taskId, attemptCount = 0 } = JSON.parse(req.body || '{}');
    
    if (!songId || !taskId) {
      throw new Error('Missing songId or taskId');
    }
    
    log(`Polling status for task ${taskId}, attempt ${attemptCount}`);
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    const functions = new Functions(client);
    
    // Check Mureka status
    const statusResponse = await fetch(`https://api.mureka.ai/v1/song/query/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${req.variables.MUREKA_API_KEY}`
      }
    });
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Mureka API error: ${errorText}`);
    }
    
    const task = await statusResponse.json();
    log('Task status:', task.status);
    
    // Handle different statuses
    if (task.status === 'succeeded') {
      // Success! Update with audio URL
      const audioUrl = task.choices?.[0]?.url;
      const flacUrl = task.choices?.[0]?.flac_url;
      const duration = task.choices?.[0]?.duration;
      
      if (!audioUrl) {
        throw new Error('No audio URL in successful response');
      }
      
      await databases.updateDocument(
        'mitchly-music-db',
        'songs',
        songId,
        {
          audioUrl: audioUrl,
          audioFlacUrl: flacUrl,
          audioDuration: duration,
          audioStatus: 'completed',
          audioCompletedAt: new Date().toISOString(),
          murekaTaskId: null // Clean up
        }
      );
      
      log('Audio generation completed successfully');
      return res.json({ success: true, status: 'completed' });
      
    } else if (['failed', 'timeouted', 'cancelled'].includes(task.status)) {
      // Failed - update status
      await databases.updateDocument(
        'mitchly-music-db',
        'songs',
        songId,
        {
          audioStatus: 'failed',
          audioError: task.failed_reason || `Generation ${task.status}`,
          murekaTaskId: null // Clean up
        }
      );
      
      log('Audio generation failed:', task.failed_reason);
      return res.json({ success: false, status: 'failed' });
      
    } else {
      // Still processing - schedule another check
      const nextAttempt = attemptCount + 1;
      
      // Give up after 20 attempts (10 minutes with 30 second intervals)
      if (nextAttempt > 20) {
        await databases.updateDocument(
          'mitchly-music-db',
          'songs',
          songId,
          {
            audioStatus: 'failed',
            audioError: 'Generation timeout - took too long',
            murekaTaskId: null
          }
        );
        
        return res.json({ success: false, status: 'timeout' });
      }
      
      // Wait 30 seconds before next check
      setTimeout(async () => {
        await functions.createExecution(
          'poll-audio-status',
          JSON.stringify({
            songId,
            taskId,
            attemptCount: nextAttempt
          }),
          false
        );
      }, 30000);
      
      log(`Scheduled next poll attempt ${nextAttempt}`);
      return res.json({ success: true, status: 'polling', attemptCount: nextAttempt });
    }
    
  } catch (err) {
    error('Error polling audio status:', err);
    
    // Try to update the document with error status
    try {
      const data = JSON.parse(req.body || '{}');
      if (data.songId) {
        const client = new Client()
          .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
          .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
          .setKey(req.variables.APPWRITE_API_KEY);
        
        const databases = new Databases(client);
        
        await databases.updateDocument(
          'mitchly-music-db',
          'songs',
          data.songId,
          {
            audioStatus: 'failed',
            audioError: err.message || 'Unknown error',
            murekaTaskId: null
          }
        );
      }
    } catch (updateErr) {
      error('Failed to update error status:', updateErr);
    }
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
