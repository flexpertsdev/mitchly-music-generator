const Anthropic = require('@anthropic-ai/sdk');

// Optional: Set your webhook.site URL here for debugging
const WEBHOOK_URL = process.env.WEBHOOK_URL || null; // Set in Netlify env vars

async function sendToWebhook(data) {
  if (!WEBHOOK_URL) return;
  
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        function: 'generate-band',
        ...data
      })
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
}

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
    const { conceptText } = JSON.parse(event.body);
    
    // Log incoming request
    await sendToWebhook({
      stage: 'request_received',
      conceptText: conceptText?.substring(0, 100) + '...'
    });

    if (!conceptText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Concept text is required' })
      };
    }

    // Use environment variable from Netlify
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Anthropic API key not found in environment variables');
      await sendToWebhook({
        stage: 'error',
        error: 'API key not found'
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API configuration error. Please ensure ANTHROPIC_API_KEY is set in Netlify environment variables.' 
        })
      };
    }
    
    await sendToWebhook({
      stage: 'api_key_found',
      key_prefix: apiKey.substring(0, 10) + '...'
    });
    
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    const prompt = `You are an expert music producer, songwriter, and band conceptualist. Create a comprehensive band profile and album concept based on this description: "${conceptText}"

Create a detailed band profile with these elements:
- Band name (creative and memorable)
- Primary and secondary genres
- Core sound description (detailed musical characteristics)
- Vocal style (specify male/female, characteristics, influences)
- Instrumentation breakdown
- 3-5 specific musical influences
- Band backstory (2-3 sentences)
- Visual identity (colors, aesthetic, logo concept)
- Lyrical themes (5-6 themes)
- Album concept with title and description
- 8-10 track titles that fit the concept
- AI description (180-200 characters for music generation platforms)
- Production style description

Respond ONLY with valid JSON in this exact format:
{
  "bandName": "Band Name",
  "primaryGenre": "Primary Genre with details",
  "secondaryGenres": ["Genre 1", "Genre 2"],
  "formationYear": "2023",
  "origin": "City, State/Country",
  "coreSound": "Detailed description of the musical style and approach...",
  "vocalStyle": {
    "type": "Vocal type and characteristics",
    "characteristics": "Detailed vocal characteristics",
    "influences": "Vocal influences description"
  },
  "instrumentation": [
    "Instrument 1: Description",
    "Instrument 2: Description"
  ],
  "influences": ["Artist 1", "Artist 2", "Artist 3", "Artist 4", "Artist 5"],
  "backstory": "Band formation story and mission...",
  "visualIdentity": {
    "colors": "Color palette description",
    "aesthetic": "Visual aesthetic description", 
    "logo": "Logo concept description",
    "style": "Overall style description"
  },
  "lyricalThemes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5", "Theme 6"],
  "albumConcept": {
    "title": "Album Title",
    "description": "Album concept description..."
  },
  "trackListing": ["Track 1", "Track 2", "Track 3", "Track 4", "Track 5", "Track 6", "Track 7", "Track 8"],
  "aiDescription": "180-200 character description for AI music platforms",
  "productionStyle": "Production approach and sonic characteristics..."
}`;

    await sendToWebhook({
      stage: 'sending_to_anthropic',
      model: 'claude-opus-4-1',
      prompt_length: prompt.length
    });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    
    // Log the raw response for debugging
    console.log('Raw API response:', content);
    await sendToWebhook({
      stage: 'api_response_received',
      response_length: content.length,
      response_preview: content.substring(0, 200)
    });
    
    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\n?/g, '');
    }
    
    // Try to parse the JSON response
    let bandProfile;
    try {
      bandProfile = JSON.parse(cleanContent.trim());
      await sendToWebhook({
        stage: 'json_parsed',
        band_name: bandProfile.bandName
      });
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', cleanContent);
      await sendToWebhook({
        stage: 'parse_error',
        error: parseError.message,
        cleaned_content: cleanContent.substring(0, 500)
      });
      throw new Error('Invalid response format from AI');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(bandProfile)
    };
  } catch (error) {
    console.error('Error generating band profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate band profile',
        details: error.message 
      })
    };
  }
};