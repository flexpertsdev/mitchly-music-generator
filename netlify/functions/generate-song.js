const Anthropic = require('@anthropic-ai/sdk');
const { Client, Databases, ID, Query } = require('node-appwrite');

// Initialize Appwrite
const appwriteClient = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '6761a31600224c0e82df')
  .setKey(process.env.APPWRITE_API_KEY);

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
    const { songTitle, trackNumber, bandProfile, songId, bandId } = JSON.parse(event.body);

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
      model: 'claude-opus-4-1-20250805',  // Using Sonnet for faster responses
      max_tokens: 4000,
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
    
    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\n?/g, '');
    }
    
    // Try to parse the JSON response
    let song;
    try {
      song = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', cleanContent);
      throw new Error('Invalid response format from AI');
    }

    // Update song in Appwrite if songId is provided
    if (process.env.APPWRITE_API_KEY && songId) {
      try {
        console.log('Updating song in database...');
        await databases.updateDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          songId,
          {
            lyrics: song.lyrics,
            description: song.songDescription,
            artistDescription: bandProfile.aiDescription || `${bandProfile.bandName} - ${bandProfile.primaryGenre}`,
            status: 'completed'
          }
        );
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue even if database update fails
      }
    } else if (process.env.APPWRITE_API_KEY && bandId) {
      // Create new song if no songId but bandId is provided
      try {
        console.log('Creating new song in database...');
        await databases.createDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          ID.unique(),
          {
            bandId: bandId,
            title: songTitle,
            trackNumber: trackNumber,
            lyrics: song.lyrics,
            description: song.songDescription,
            artistDescription: bandProfile.aiDescription || `${bandProfile.bandName} - ${bandProfile.primaryGenre}`,
            audioUrl: null,
            status: 'completed'
          }
        );
      } catch (dbError) {
        console.error('Database create error:', dbError);
        // Continue even if database create fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...song,
        artistDescription: bandProfile.aiDescription || `${bandProfile.bandName} - ${bandProfile.primaryGenre}`
      })
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