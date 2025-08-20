const { Client, Databases, Storage, ID, Query } = require('node-appwrite');

// Initialize Appwrite
const appwriteClient = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '6761a31600224c0e82df')
  .setKey(process.env.APPWRITE_API_KEY); // Server-side API key

const databases = new Databases(appwriteClient);
const storage = new Storage(appwriteClient);

// Database constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const SONGS_COLLECTION = 'songs';
const BUCKET_ID = 'band-images';

// System prompt for band generation
const SYSTEM_PROMPT = `You are a creative music producer and band concept designer. Your task is to create unique, compelling fictional bands with rich backstories and detailed musical identities.

When given a genre or style, create a complete band profile including:
- A memorable band name that fits the genre
- Detailed musical style and sub-genres
- Band formation story and background
- Core sound description
- Visual identity and aesthetic
- Album concept with thematic coherence
- 10-12 track listing with evocative song titles
- Lyrical themes and vocal approach
- Influences and musical DNA

Make each band feel authentic, with a unique voice and artistic vision. The band should feel like they could exist in the real music scene.

Return your response as a valid JSON object with this structure:
{
  "bandName": "string",
  "primaryGenre": "string",
  "subGenres": ["array of strings"],
  "formationYear": "string (year)",
  "origin": "string (city, country)",
  "backstory": "string (2-3 sentences)",
  "coreSound": "string (1-2 sentences)",
  "influences": ["array of 3-5 artist names"],
  "lyricalThemes": ["array of 3-5 themes"],
  "vocalStyle": {
    "type": "string (e.g., 'powerful female vocals', 'raspy male vocals')",
    "description": "string (1 sentence)"
  },
  "visualIdentity": {
    "colors": "string (color palette description)",
    "aesthetic": "string (visual style)",
    "logo": "string (logo concept)",
    "style": "string (fashion/stage presence)"
  },
  "albumConcept": {
    "title": "string",
    "theme": "string",
    "description": "string (2-3 sentences about the album's narrative or concept)"
  },
  "trackListing": ["array of 10-12 song titles"],
  "songStubs": [
    {
      "title": "string",
      "trackNumber": number,
      "description": "string (1-2 sentences about the song's theme/story)",
      "musicalElements": "string (tempo, key musical features)"
    }
  ],
  "aiDescription": "string (description formatted for AI music generation platforms)"
}`;

// Generate images with FAL
async function generateImages(band) {
  const images = {};
  
  // Check if FAL_API_KEY is available
  const FAL_API_KEY = process.env.FAL_API_KEY;
  if (!FAL_API_KEY) {
    console.log('FAL API key not configured, skipping image generation');
    return images;
  }

  try {
    // Generate band logo using Flux Dev (better for logos)
    console.log('Generating band logo...');
    const logoResponse = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `minimalist band logo design for "${band.bandName}", ${band.primaryGenre} band, ${band.visualIdentity.logo}, professional logo, vector style, black and white, high contrast`,
        num_images: 1,
        image_size: 'square',
        num_inference_steps: 28
      })
    });

    if (logoResponse.ok) {
      const logoData = await logoResponse.json();
      images.logo = logoData.images?.[0]?.url;
    }

    // Generate album cover using Flux Schnell (faster, good for album art)
    console.log('Generating album cover...');
    const albumResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `album cover art for "${band.albumConcept.title}" by ${band.bandName}, ${band.primaryGenre} music, ${band.albumConcept.theme}, ${band.visualIdentity.aesthetic}, artistic, professional album artwork`,
        num_images: 1,
        image_size: 'square',
        num_inference_steps: 4
      })
    });

    if (albumResponse.ok) {
      const albumData = await albumResponse.json();
      images.album = albumData.images?.[0]?.url;
    }

    // Generate band photo using Flux Realism (best for photorealistic)
    console.log('Generating band photo...');
    const photoResponse = await fetch('https://fal.run/fal-ai/flux-realism', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `professional band photo of ${band.bandName}, ${band.primaryGenre} band, ${band.visualIdentity.style}, band promotional photo, high quality photography`,
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
    // Continue without images if generation fails
  }
  
  return images;
}

// Upload image to Appwrite Storage
async function uploadImageToStorage(imageUrl, filename) {
  try {
    // First check if bucket exists, create if not
    try {
      await storage.getBucket(BUCKET_ID);
    } catch (e) {
      // Create bucket if it doesn't exist
      await storage.createBucket(
        BUCKET_ID,
        'Band Images',
        ['read("any")'],
        ['write("any")'],
        true,
        true,
        30000000, // 30MB max file size
        ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'none',
        false,
        false
      );
    }

    // Download image from URL
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    
    // Create file in Appwrite storage
    const file = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      buffer
    );
    
    // Return the file URL
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
    const { genre = 'indie rock', style = '', influences = [] } = JSON.parse(event.body);

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Build the user prompt
    let userPrompt = `Create a ${genre} band`;
    if (style) {
      userPrompt += ` with ${style} style`;
    }
    if (influences.length > 0) {
      userPrompt += ` influenced by ${influences.join(', ')}`;
    }

    // Generate band concept with Claude
    console.log('Generating band concept...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const generatedText = data.content[0].text;

    // Parse the JSON response
    let band;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        band = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing band JSON:', parseError);
      throw new Error('Failed to parse band concept');
    }

    // Add song stubs if not present
    if (!band.songStubs && band.trackListing) {
      band.songStubs = band.trackListing.map((title, index) => ({
        title,
        trackNumber: index + 1,
        description: `Track ${index + 1} from the album ${band.albumConcept?.title || 'Untitled'}`,
        musicalElements: `${band.primaryGenre} style, ${band.vocalStyle?.type || 'vocals'}`
      }));
    }

    // Generate images with FAL (optional - won't fail if API key missing)
    console.log('Generating images for band...');
    const images = await generateImages(band);

    // Prepare image URLs for database
    const imageUrls = {};

    // Only upload images if Appwrite API key is configured
    if (process.env.APPWRITE_API_KEY) {
      if (images.logo) {
        imageUrls.logoUrl = await uploadImageToStorage(images.logo, `${band.bandName}-logo.png`);
      }
      if (images.album) {
        imageUrls.albumCoverUrl = await uploadImageToStorage(images.album, `${band.albumConcept.title}-cover.png`);
      }
      if (images.photo) {
        imageUrls.bandPhotoUrl = await uploadImageToStorage(images.photo, `${band.bandName}-photo.png`);
      }
    }

    // Save band to Appwrite Database (if API key is configured)
    let bandDocument = null;
    if (process.env.APPWRITE_API_KEY) {
      try {
        console.log('Saving band to database...');
        bandDocument = await databases.createDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          ID.unique(),
          {
            bandName: band.bandName,
            primaryGenre: band.primaryGenre,
            profileData: JSON.stringify(band),
            albumTitle: band.albumConcept?.title || '',
            albumDescription: band.albumConcept?.description || '',
            trackCount: band.trackListing?.length || 0,
            ...imageUrls
          }
        );

        // Create song placeholders in database
        if (band.songStubs && band.songStubs.length > 0) {
          console.log('Creating song placeholders...');
          for (const stub of band.songStubs) {
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
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without database save
      }
    }

    // Return the complete band with database ID (if saved) and image URLs
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...band,
        $id: bandDocument?.$id || `local_${Date.now()}`,
        images: imageUrls,
        message: 'Band successfully generated!'
      })
    };

  } catch (error) {
    console.error('Error generating band:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate band',
        details: error.message 
      })
    };
  }
};