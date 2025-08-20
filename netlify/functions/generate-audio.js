const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite
// Try both possible API key environment variable names
const apiKey = process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY;
console.log('Initializing Appwrite with API key:', apiKey ? 'Found' : 'Missing');

const appwriteClient = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'flexos')
  .setKey(apiKey);

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
    const { lyrics, prompt, model = 'mureka-o1', stream = false, songId } = JSON.parse(event.body);

    if (!lyrics || !prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Lyrics and prompt are required' })
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

    // Start the song generation task
    const generateResponse = await fetch('https://api.mureka.ai/v1/song/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MUREKA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lyrics,
        model,
        prompt,
        stream
      })
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      console.error('Mureka API error:', error);
      return {
        statusCode: generateResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to start song generation',
          details: error 
        })
      };
    }

    const task = await generateResponse.json();
    console.log('Mureka API response:', JSON.stringify(task, null, 2));
    console.log('Song ID provided:', songId);
    console.log('APPWRITE_API_KEY exists:', !!process.env.APPWRITE_API_KEY);

    // Save the task ID to Appwrite if songId is provided
    if (process.env.APPWRITE_API_KEY && songId) {
      try {
        console.log('Updating song with Mureka task ID:', task.id);
        const updateResult = await databases.updateDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          songId,
          {
            murekaTaskId: task.id,
            audioStatus: 'generating',
            audioGeneratedAt: new Date().toISOString()
          }
        );
        console.log('Database update successful:', updateResult);
      } catch (dbError) {
        console.error('Database update error:', dbError.message || dbError);
        console.error('Full error:', JSON.stringify(dbError, null, 2));
        // Continue even if database update fails
      }
    } else {
      console.log('Skipping database update - missing:', {
        hasApiKey: !!process.env.APPWRITE_API_KEY,
        hasSongId: !!songId
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        taskId: task.id,
        status: task.status,
        createdAt: task.created_at,
        model: task.model
      })
    };

  } catch (error) {
    console.error('Error generating audio:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate audio',
        details: error.message 
      })
    };
  }
};