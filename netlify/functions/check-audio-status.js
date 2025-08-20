const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite
const appwriteClient = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'flexos')
  .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(appwriteClient);

// Database constants
const DATABASE_ID = 'mitchly-music-db';
const SONGS_COLLECTION = 'songs';

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { taskId, songId } = JSON.parse(event.body);
    
    if (!taskId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task ID is required' })
      };
    }

    // Use environment variable from Netlify (not exposed to client)
    const MUREKA_API_KEY = process.env.VITE_MUREKA_API_KEY || process.env.MUREKA_API_KEY;
    
    if (!MUREKA_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Mureka API key not configured' })
      };
    }

    // Check the status of the task using the correct endpoint
    const statusResponse = await fetch(`https://api.mureka.ai/v1/song/query/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MUREKA_API_KEY}`
      }
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      console.error('Mureka API error:', error);
      return {
        statusCode: statusResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to check task status',
          details: error 
        })
      };
    }

    const task = await statusResponse.json();

    // Map task status to our format
    let status = 'pending';
    let progress = 0;
    let audioUrl = null;
    let flacUrl = null;
    let duration = null;
    let error = null;

    switch (task.status) {
      case 'succeeded':
        status = 'completed';
        progress = 100;
        // Get the first choice's URL (or you could return all choices)
        if (task.choices && task.choices.length > 0) {
          audioUrl = task.choices[0].url;
          flacUrl = task.choices[0].flac_url;
          duration = task.choices[0].duration;
          
          // Update the song in Appwrite with the audio URL
          if (process.env.APPWRITE_API_KEY && songId) {
            try {
              console.log('Updating song with audio URL...');
              await databases.updateDocument(
                DATABASE_ID,
                SONGS_COLLECTION,
                songId,
                {
                  audioUrl: audioUrl,
                  audioFlacUrl: flacUrl,
                  audioDuration: duration,
                  audioStatus: 'completed',
                  audioCompletedAt: new Date().toISOString()
                }
              );
            } catch (dbError) {
              console.error('Database update error:', dbError);
              // Continue even if database update fails
            }
          }
        }
        break;
      
      case 'failed':
      case 'timeouted':
      case 'cancelled':
        status = 'failed';
        error = task.failed_reason || 'Audio generation failed';
        
        // Update the song status in Appwrite
        if (process.env.APPWRITE_API_KEY && songId) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              SONGS_COLLECTION,
              songId,
              {
                audioStatus: 'failed',
                audioError: error
              }
            );
          } catch (dbError) {
            console.error('Database update error:', dbError);
          }
        }
        break;
      
      case 'preparing':
      case 'queued':
        status = 'pending';
        progress = 25;
        break;
      
      case 'running':
        status = 'processing';
        progress = 50;
        break;
      
      case 'streaming':
        status = 'processing';
        progress = 75;
        // You could also return the stream_url here if needed
        break;
      
      default:
        status = 'pending';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status,
        progress,
        audio_url: audioUrl,
        flac_url: flacUrl,
        duration,
        error,
        taskDetails: task, // Include full task details for debugging
        choices: task.choices // Include all generated songs if you want to give users options
      })
    };

  } catch (error) {
    console.error('Error checking audio status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to check audio status',
        details: error.message 
      })
    };
  }
};