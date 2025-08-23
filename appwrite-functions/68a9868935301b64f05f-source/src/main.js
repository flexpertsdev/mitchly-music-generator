import { Client, Databases, ID } from 'node-appwrite';
import { getStaticFile, throwIfMissing } from './utils.js';

// This Appwrite function generates music using Mureka AI
export default async ({ req, res, log, error }) => {
  // Serve the HTML test page on GET requests
  if (req.method === 'GET') {
    const html = getStaticFile('index.html');
    return res.text(html, 200, {
      'Content-Type': 'text/html; charset=utf-8'
    });
  }

  // Handle POST requests for music generation
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  // Parse the request body
  let songId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    songId = body.songId;
    
    if (!songId) {
      return res.json({ error: 'Missing songId in request body' }, 400);
    }
  } catch (err) {
    error('Failed to parse request body: ' + err.message);
    return res.json({ error: 'Invalid request body' }, 400);
  }

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  
  const databases = new Databases(client);

  try {
    // Step 1: Read the song document from the database
    log(`Fetching song with ID: ${songId}`);
    const song = await databases.getDocument(
      'mitchly-music-db',
      'songs',
      songId
    );

    if (!song) {
      return res.json({ error: 'Song not found' }, 404);
    }

    // Step 2: Prepare the Mureka API request
    // Format lyrics (ensure it's API safe)
    const lyrics = song.lyrics || '';
    
    // Build the prompt from song data (max 1000 characters)
    const promptParts = [];
    if (song.title) promptParts.push(`Title: ${song.title}`);
    if (song.description) promptParts.push(`Description: ${song.description}`);
    if (song.trackNumber) promptParts.push(`Track #${song.trackNumber}`);
    if (song.artistDescription) promptParts.push(`Artist: ${song.artistDescription}`);
    
    let prompt = promptParts.join(', ');
    // Ensure prompt doesn't exceed 1000 characters
    if (prompt.length > 1000) {
      prompt = prompt.substring(0, 997) + '...';
    }

    // If no prompt parts, use a default
    if (!prompt) {
      prompt = 'Create a song';
    }

    const murekaRequestBody = {
      lyrics: lyrics,
      model: 'auto',
      prompt: prompt,
      stream: true
    };

    log('Sending request to Mureka AI...');
    log(`Prompt: ${prompt}`);

    // Step 3: Make the API call to Mureka
    const murekaResponse = await fetch('https://api.mureka.ai/v1/song/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(murekaRequestBody)
    });

    if (!murekaResponse.ok) {
      const errorText = await murekaResponse.text();
      error(`Mureka API error: ${murekaResponse.status} - ${errorText}`);
      return res.json({ 
        error: 'Failed to generate music', 
        details: errorText 
      }, murekaResponse.status);
    }

    const murekaData = await murekaResponse.json();
    log(`Mureka task created with ID: ${murekaData.id}`);

    // Step 4: Update the song document with the Mureka task ID
    await databases.updateDocument(
      'mitchly-music-db',
      'songs',
      songId,
      {
        murekaTaskId: murekaData.id,
        murekaStatus: murekaData.status || 'preparing',
        murekaCreatedAt: murekaData.created_at
      }
    );

    log(`Successfully updated song ${songId} with Mureka task ID: ${murekaData.id}`);

    // Return success response
    return res.json({
      success: true,
      message: 'Music generation started',
      songId: songId,
      murekaTaskId: murekaData.id,
      status: murekaData.status,
      traceId: murekaData.trace_id
    });

  } catch (err) {
    error(`Function error: ${err.message}`);
    return res.json({ 
      error: 'Internal server error', 
      message: err.message 
    }, 500);
  }
};
