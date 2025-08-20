const Anthropic = require('@anthropic-ai/sdk');
const { Client, Databases, Storage, ID, Query } = require('node-appwrite');

// Initialize Appwrite
const appwriteClient = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'flexos')
  .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(appwriteClient);
const storage = new Storage(appwriteClient);

// Database constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const SONGS_COLLECTION = 'songs';
const BUCKET_ID = 'band-images';

// Optional webhook for debugging
const WEBHOOK_URL = process.env.WEBHOOK_URL || null;

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

// Generate images with FAL
async function generateImages(band) {
  const images = {};
  const FAL_API_KEY = process.env.FAL_API_KEY;
  
  if (!FAL_API_KEY) {
    console.log('FAL API key not configured, skipping image generation');
    return images;
  }

  try {
    // Generate band logo
    console.log('Generating band logo...');
    const logoResponse = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `minimalist band logo design for "${band.bandName}", ${band.primaryGenre} band, professional logo, vector style`,
        num_images: 1,
        image_size: 'square',
        num_inference_steps: 28
      })
    });

    if (logoResponse.ok) {
      const logoData = await logoResponse.json();
      images.logo = logoData.images?.[0]?.url;
    }

    // Generate album cover
    console.log('Generating album cover...');
    const albumResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `album cover art for "${band.albumTitle}" by ${band.bandName}, ${band.primaryGenre} music, artistic, professional`,
        num_images: 1,
        image_size: 'square',
        num_inference_steps: 4
      })
    });

    if (albumResponse.ok) {
      const albumData = await albumResponse.json();
      images.album = albumData.images?.[0]?.url;
    }

    // Generate band photo
    console.log('Generating band photo...');
    const photoResponse = await fetch('https://fal.run/fal-ai/flux-realism', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `professional band photo of ${band.bandName}, ${band.primaryGenre} band, promotional photo`,
        num_images: 1,
        image_size: 'landscape_16_9',
        num_inference_steps: 28
      })
    });

    if (photoResponse.ok) {
      const photoData = await photoResponse.json();
      images.photo = photoData.images?.[0]?.url;
    }
  } catch (error) {
    console.error('Error generating images:', error);
  }
  
  return images;
}

// Upload image to Appwrite Storage
async function uploadImageToStorage(imageUrl, filename) {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    
    const file = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      buffer
    );
    
    return `${process.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${process.env.VITE_APPWRITE_PROJECT_ID}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
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
    const { conceptText, advancedData } = JSON.parse(event.body);
    
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

    // Construct the prompt based on whether we have advanced data or just concept text
    let promptInput = conceptText;
    if (advancedData) {
      // Build a structured prompt from advanced form data
      promptInput = `
Band Name: ${advancedData.bandName || 'Create a band name'}
Genre: ${advancedData.genre || 'Choose appropriate genre'}
Album Title: ${advancedData.albumName || 'Create album title'}
Number of Tracks: ${advancedData.trackCount || '8-12'}
Influences: ${advancedData.influences || 'Choose appropriate influences'}
Themes: ${advancedData.themes || 'Choose appropriate themes'}
Concept: ${advancedData.concept || conceptText}
      `.trim();
    }

    const prompt = `You are an expert music producer, songwriter, and band conceptualist. Create a comprehensive band profile and album concept based on this input:

${promptInput}

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
- 8-12 track titles that fit the concept and create a cohesive musical experience
- AI description (180-200 characters for music generation platforms)
- Production style description
- Detailed song stubs for each track

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
  "songStubs": [
    {
      "title": "Track Title",
      "trackNumber": 1,
      "description": "1-2 sentences about the song's theme/story",
      "musicalElements": "tempo, key musical features, mood"
    }
  ],
  "aiDescription": "180-200 character description for AI music platforms",
  "productionStyle": "Production approach and sonic characteristics..."
}`;

    await sendToWebhook({
      stage: 'sending_to_anthropic',
      model: 'claude-3-5-sonnet-20241022',
      prompt_length: prompt.length
    });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',  // Using Sonnet for faster responses
      max_tokens: 4000,  // Reduced for faster generation
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

    // Generate images with FAL
    console.log('Generating images for band...');
    const images = await generateImages(bandProfile);

    // Prepare image URLs for database
    const imageUrls = {};

    // Save band to Appwrite Database (if API key is configured)
    let bandDocument = null;
    if (process.env.APPWRITE_API_KEY) {
      try {
        // Upload images to Appwrite if they were generated
        if (images.logo) {
          imageUrls.logoUrl = await uploadImageToStorage(images.logo, `${bandProfile.bandName}-logo.png`);
        }
        if (images.album) {
          imageUrls.albumCoverUrl = await uploadImageToStorage(images.album, `${bandProfile.albumConcept?.title || 'album'}-cover.png`);
        }
        if (images.photo) {
          imageUrls.bandPhotoUrl = await uploadImageToStorage(images.photo, `${bandProfile.bandName}-photo.png`);
        }

        console.log('Saving band to database...');
        bandDocument = await databases.createDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          ID.unique(),
          {
            bandName: bandProfile.bandName,
            primaryGenre: bandProfile.primaryGenre,
            profileData: JSON.stringify(bandProfile),
            albumTitle: bandProfile.albumConcept?.title || '',
            albumDescription: bandProfile.albumConcept?.description || '',
            trackCount: bandProfile.trackListing?.length || 0,
            ...imageUrls
          }
        );

     // Create song placeholders in database
if (bandProfile.songStubs && bandProfile.songStubs.length > 0) {
  console.log('Creating songs from detailed stubs...');
  for (const stub of bandProfile.songStubs) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        SONGS_COLLECTION,
        ID.unique(),
        {
          bandId: bandDocument.$id,
          title: stub.title,
          trackNumber: stub.trackNumber,
          description: stub.description,
          musicalElements: stub.musicalElements || '',
          lyrics: '',
          audioUrl: null,
          status: 'pending'
        }
      );
    } catch (songError) {
      console.error('Error creating song:', songError);
    }
  }
} else if (bandProfile.trackListing && bandProfile.trackListing.length > 0) {
  // Fallback to simple track listing if no stubs
  console.log('Creating song placeholders from track listing...');
  for (let i = 0; i < bandProfile.trackListing.length; i++) {
    const title = bandProfile.trackListing[i];
    try {
      await databases.createDocument(
        DATABASE_ID,
        SONGS_COLLECTION,
        ID.unique(),
        {
          bandId: bandDocument.$id,
          title: title,
          trackNumber: i + 1,
          description: `Track ${i + 1} from ${bandProfile.albumConcept?.title || 'the album'}`,
          musicalElements: `${bandProfile.primaryGenre} style`,
          lyrics: '',
          audioUrl: null,
          status: 'pending'
        }
      );
    } catch (songError) {
      console.error('Error creating song:', songError);
    }
  }
}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...bandProfile,
        $id: bandDocument?.$id || `local_${Date.now()}`,
        images: imageUrls,
        message: 'Band successfully generated!'
      })
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