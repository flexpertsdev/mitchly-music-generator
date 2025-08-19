const Anthropic = require('@anthropic-ai/sdk');

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
    const { songTitle, trackNumber, bandProfile } = JSON.parse(event.body);

    if (!songTitle || !trackNumber || !bandProfile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song title, track number, and band profile are required' })
      };
    }

    // Use environment variable from Netlify
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Anthropic API key not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API configuration error. Please ensure ANTHROPIC_API_KEY is set in Netlify environment variables.' 
        })
      };
    }
    
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    const prompt = `You are an expert songwriter creating Track ${trackNumber}: "${songTitle}" for the band ${bandProfile.bandName}.

Band Profile Context:
- Genre: ${bandProfile.primaryGenre}
- Core Sound: ${bandProfile.coreSound}
- Vocal Style: ${bandProfile.vocalStyle?.type || bandProfile.vocalStyle}
- Album: ${bandProfile.albumConcept?.title}
- Album Theme: ${bandProfile.albumConcept?.description}
- Lyrical Themes: ${bandProfile.lyricalThemes?.join(', ')}
- Musical Influences: ${bandProfile.influences?.join(', ')}

Create a complete song with:
1. Song-specific description (under 100 characters for AI music platforms)
2. Complete lyrics with proper structure for AI music generation

The song should:
- Fit the band's style and the album's concept
- Have a unique theme that complements the overall album narrative
- Include proper song structure with [Intro], [Verse], [Chorus], [Bridge], [Outro] sections
- Match the vocal style and genre characteristics
- Be optimized for AI music generation platforms

Respond ONLY with valid JSON in this exact format:
{
  "songDescription": "Brief description under 100 characters about tempo, mood, and musical elements",
  "lyrics": "Complete song lyrics with proper sectioning:\\n\\n[Intro]\\n(description)\\nlyrics\\n\\n[Verse 1]\\nlyrics\\n\\n[Pre-Chorus]\\nlyrics\\n\\n[Chorus]\\nlyrics\\n\\n[Verse 2]\\nlyrics\\n\\n[Bridge]\\nlyrics\\n\\n[Final Chorus]\\nlyrics\\n\\n[Outro]\\nlyrics"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    const song = JSON.parse(content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(song)
    };
  } catch (error) {
    console.error('Error generating song:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate song',
        details: error.message 
      })
    };
  }
};