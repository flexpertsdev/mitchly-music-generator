// Check if we're running locally or on Netlify
const isProduction = import.meta.env.PROD;
const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');

// For local development with direct API calls (optional)
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

let anthropic = null;
if (!isProduction && !isNetlify && ANTHROPIC_API_KEY) {
  // Only use direct API calls in local development if API key is present
  const Anthropic = await import('@anthropic-ai/sdk');
  anthropic = new Anthropic.default({
    apiKey: ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true
  });
}

export async function generateBandProfile(conceptText) {
  // Use serverless function in production or when no API key
  if (isProduction || isNetlify || !anthropic) {
    try {
      const response = await fetch('/.netlify/functions/generate-band', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conceptText })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate band profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling serverless function:', error);
      throw error;
    }
  }

  // Local development with direct API call (fallback)
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

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating band profile:', error);
    throw new Error('Failed to generate band profile. Please check your API key and try again.');
  }
}

export async function generateSong(songTitle, trackNumber, bandProfile) {
  // Use serverless function in production or when no API key
  if (isProduction || isNetlify || !anthropic) {
    try {
      const response = await fetch('/.netlify/functions/generate-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songTitle, trackNumber, bandProfile })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate song');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling serverless function:', error);
      throw error;
    }
  }

  // Local development with direct API call (fallback)
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

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating song:', error);
    throw new Error('Failed to generate song. Please check your API key and try again.');
  }
}