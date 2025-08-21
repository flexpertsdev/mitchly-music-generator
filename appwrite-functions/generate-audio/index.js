import { Client, Databases, Functions } from 'node-appwrite';
import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
  try {
    // Parse the event data
    const payload = JSON.parse(req.body);
    const document = payload.$response;
    
    // Only process if audioStatus changed to 'generating'
    if (document.audioStatus !== 'generating') {
      return res.json({ success: true, message: 'Not generating audio status' });
    }
    
    log('Starting audio generation for song:', document.$id);
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    const functions = new Functions(client);
    
    // Make sure we have lyrics
    if (!document.lyrics) {
      throw new Error('No lyrics found for this song');
    }
    
    // Call Mureka API to start generation
    log('Calling Mureka API...');
    const generateResponse = await fetch('https://api.mureka.ai/v1/song/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.variables.MUREKA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lyrics: document.lyrics,
        model: 'mureka-o1',
        prompt: document.description || 'Generate a song',
        stream: false
      })
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`Mureka API error: ${errorText}`);
    }
    
    const task = await generateResponse.json();
    log('Mureka task created:', task.id);
    
    // Update document with task ID and processing status
    await databases.updateDocument(
      'mitchly-music-db',
      'songs',
      document.$id,
      {
        murekaTaskId: task.id,
        audioStatus: 'processing',
        audioGeneratedAt: new Date().toISOString()
      }
    );
    
    // Create execution to poll for status
    // We'll manually execute the poll function instead of using a schedule
    await functions.createExecution(
      'poll-audio-status',
      JSON.stringify({
        songId: document.$id,
        taskId: task.id,
        attemptCount: 0
      }),
      false // async
    );
    
    log('Started polling function');
    
    return res.json({
      success: true,
      songId: document.$id,
      taskId: task.id
    });
    
  } catch (err) {
    error('Error generating audio:', err);
    
    // Try to update the document with error status
    try {
      const client = new Client()
        .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
        .setKey(req.variables.APPWRITE_API_KEY);
      
      const databases = new Databases(client);
      const payload = JSON.parse(req.body);
      
      await databases.updateDocument(
        'mitchly-music-db',
        'songs',
        payload.$response.$id,
        {
          audioStatus: 'failed',
          audioError: err.message || 'Unknown error'
        }
      );
    } catch (updateErr) {
      error('Failed to update error status:', updateErr);
    }
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
