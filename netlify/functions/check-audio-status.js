exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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
    const taskId = event.queryStringParameters?.taskId;

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

    // Query the task status
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

    const taskData = await statusResponse.json();

    // Extract relevant information
    const response = {
      taskId: taskData.id,
      status: taskData.status,
      createdAt: taskData.created_at,
      finishedAt: taskData.finished_at,
      model: taskData.model,
      failedReason: taskData.failed_reason
    };

    // If succeeded, include the audio URLs
    if (taskData.status === 'succeeded' && taskData.choices && taskData.choices.length > 0) {
      response.songs = taskData.choices.map(choice => ({
        id: choice.id,
        title: choice.title,
        audioUrl: choice.audio_url,
        duration: choice.duration,
        imageUrl: choice.image_url
      }));
    }

    // If streaming, include stream URL
    if (taskData.status === 'streaming' && taskData.stream_url) {
      response.streamUrl = taskData.stream_url;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
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