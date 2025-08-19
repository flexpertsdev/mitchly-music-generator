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
    const { lyrics, prompt, model = 'mureka-o1', stream = false } = JSON.parse(event.body);

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