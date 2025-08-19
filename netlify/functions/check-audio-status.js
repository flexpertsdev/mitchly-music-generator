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
    const { taskId } = JSON.parse(event.body);

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

    // Check the status of the task
    const statusResponse = await fetch(`https://api.mureka.ai/v1/song/tasks/${taskId}`, {
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
    let error = null;

    if (task.status === 'completed' || task.status === 'success') {
      status = 'completed';
      progress = 100;
      audioUrl = task.audio_url || task.result?.audio_url || task.output?.audio_url;
    } else if (task.status === 'failed' || task.status === 'error') {
      status = 'failed';
      error = task.error || 'Audio generation failed';
    } else if (task.status === 'processing' || task.status === 'running') {
      status = 'processing';
      progress = task.progress || 50;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status,
        progress,
        audio_url: audioUrl,
        error,
        taskDetails: task // Include full task details for debugging
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