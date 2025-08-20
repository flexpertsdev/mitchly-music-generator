// This function simulates streaming by returning progress status
// Actual streaming isn't supported by Netlify Functions, so we'll use polling instead

const Anthropic = require('@anthropic-ai/sdk');
const { Client, Databases, Storage, ID } = require('node-appwrite');

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

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, advancedData } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Use environment variable from Netlify
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Anthropic API key not found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API configuration error' })
      };
    }
    
    const anthropic = new Anthropic({ apiKey });

    // Combine prompt with advanced data if provided
    let fullPrompt = prompt;
    if (advancedData) {
      fullPrompt = `
Band Name: ${advancedData.bandName || 'To be determined'}
Genre: ${advancedData.genre || 'Mixed'}
Album: ${advancedData.albumName || 'Debut album'}
Track Count: ${advancedData.trackCount || 8}
Influences: ${advancedData.influences || 'Various'}
Themes: ${advancedData.themes || 'Life experiences'}
Concept: ${advancedData.concept || prompt}

Original prompt: ${prompt}`;
    }

    // Generate band profile with retry logic for overload errors
    let message;
    let retries = 3;
    
    while (retries > 0) {
      try {
        message = await anthropic.messages.create({
          model: "claude-opus-4-1-20250805",
          max_tokens: 4000,
          temperature: 0.7,
          system: `You are a creative music industry professional helping to create fictional band profiles.
Create a complete band profile based on the user's concept.
Be creative, specific, and ensure the band feels authentic and unique.

Provide a response in valid JSON format with this exact structure:
{
  "bandName": "string",
  "primaryGenre": "string",
  "influences": ["string", "string", "string"],
  "coreSound": "string (2-3 sentences)",
  "vocalStyle": {
    "type": "string (e.g., 'powerful female lead', 'harmonized male/female duet')",
    "description": "string"
  },
  "origin": "string (city, country)",
  "formationYear": number,
  "backstory": "string (2-3 sentences)",
  "visualIdentity": {
    "colors": "string",
    "aesthetic": "string", 
    "logo": "string (logo concept description)",
    "style": "string (overall visual style)"
  },
  "lyricalThemes": ["string", "string", "string", "string", "string"],
  "albumConcept": {
    "title": "string",
    "description": "string (2-3 sentences)"
  },
  "trackListing": ["string", "string", "string", "string", "string", "string", "string", "string"],
  "aiDescription": "string (EXACTLY 180-200 characters describing the band's musical style for AI music generation)",
  "productionStyle": "string (describe production approach)",
  "formationStory": {
    "howMet": "string (how the band members met)",
    "earlyDays": "string (early days of the band)",
    "breakthrough": "string (breakthrough moment)"
  },
  "visualIdentityStyle": "string (overall visual identity approach)"
}

Important requirements:
- AI description must be EXACTLY 180-200 characters for music generation platforms
- Include detailed formation story
- Include production style description
- 8-12 track titles that fit the concept
- Ensure all track names are unique and fit the band's concept`,
          messages: [{
            role: "user",
            content: fullPrompt
          }]
        });
        
        // If successful, break out of retry loop
        break;
      } catch (error) {
        if (error.status === 529 && retries > 1) {
          // Anthropic is overloaded, wait and retry
          console.log(`Anthropic overloaded, retrying in 2 seconds... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          // Other error or no retries left, throw it
          throw error;
        }
      }
    }
    
    if (!message) {
      throw new Error('Failed to generate band profile after retries');
    }

    const profileText = message.content[0].text;
    const cleanedText = profileText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const bandProfile = JSON.parse(cleanedText);

    // Ensure AI description is exactly 180-200 characters
    if (!bandProfile.aiDescription || bandProfile.aiDescription.length < 180 || bandProfile.aiDescription.length > 200) {
      const baseAiDesc = `${bandProfile.primaryGenre} band with ${bandProfile.vocalStyle.type}. ${bandProfile.coreSound}`;
      bandProfile.aiDescription = baseAiDesc.length > 200 ? baseAiDesc.substring(0, 197) + '...' : 
                                 baseAiDesc.length < 180 ? baseAiDesc + ' Creating authentic music with passion and energy.' : baseAiDesc;
    }

    // Generate visual prompts
    const logoPrompt = `Band logo for "${bandProfile.bandName}": ${bandProfile.visualIdentity.logo}. Style: ${bandProfile.visualIdentity.aesthetic}. Colors: ${bandProfile.visualIdentity.colors}. Clean, iconic, suitable for merchandise.`;
    
    const albumCoverPrompt = `Album cover for "${bandProfile.albumConcept.title}" by ${bandProfile.bandName}: ${bandProfile.albumConcept.description}. Visual style: ${bandProfile.visualIdentity.aesthetic}. ${bandProfile.primaryGenre} aesthetic.`;
    
    const bandPhotoPrompt = `Professional band photo of ${bandProfile.bandName}: ${bandProfile.backstory}. ${bandProfile.visualIdentity.style} aesthetic. ${bandProfile.vocalStyle.description}.`;

    // Song stubs for detailed track information
    const songStubs = bandProfile.trackListing.map((track, index) => {
      const theme = bandProfile.lyricalThemes[index % bandProfile.lyricalThemes.length];
      const baseDesc = `${bandProfile.primaryGenre} track about ${theme}. ${bandProfile.vocalStyle.type} vocals.`;
      
      // Ensure description is under 100 characters
      const description = baseDesc.length > 100 ? baseDesc.substring(0, 97) + '...' : baseDesc;
      
      return {
        title: track,
        trackNumber: index + 1,
        description: description
      };
    });

    // Save band to database
    const bandData = {
      ...bandProfile,
      songStubs,
      createdAt: new Date().toISOString(),
      logoPrompt,
      albumCoverPrompt,
      bandPhotoPrompt
    };

    const savedBand = await databases.createDocument(
      DATABASE_ID,
      BANDS_COLLECTION,
      ID.unique(),
      {
        name: bandProfile.bandName,
        profileData: JSON.stringify(bandData),
        createdAt: new Date().toISOString()
      }
    );

    // Generate images using fal.ai
    const falHeaders = {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Generate all images in parallel
    const [logoResponse, albumResponse, photoResponse] = await Promise.all([
      fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: falHeaders,
        body: JSON.stringify({
          prompt: logoPrompt,
          image_size: 'square',
          num_images: 1
        })
      }).then(r => r.json()).catch(e => null),
      
      fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: falHeaders,
        body: JSON.stringify({
          prompt: albumCoverPrompt,
          image_size: 'square',
          num_images: 1
        })
      }).then(r => r.json()).catch(e => null),
      
      fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: falHeaders,
        body: JSON.stringify({
          prompt: bandPhotoPrompt,
          image_size: 'landscape_16_9',
          num_images: 1
        })
      }).then(r => r.json()).catch(e => null)
    ]);

    // Download and upload images to Appwrite storage
    const uploadImage = async (imageUrl, fileName) => {
      if (!imageUrl) return null;
      
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        
        const file = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          imageBuffer
        );
        
        // Get the file URL
        const fileUrl = `${process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${process.env.VITE_APPWRITE_PROJECT_ID || 'flexos'}`;
        return fileUrl;
      } catch (error) {
        console.error(`Error uploading ${fileName}:`, error);
        return null;
      }
    };

    // Upload all images
    const [logoUrl, albumCoverUrl, bandPhotoUrl] = await Promise.all([
      uploadImage(logoResponse?.images?.[0]?.url, `${bandProfile.bandName}-logo.jpg`),
      uploadImage(albumResponse?.images?.[0]?.url, `${bandProfile.albumConcept.title}-cover.jpg`),
      uploadImage(photoResponse?.images?.[0]?.url, `${bandProfile.bandName}-photo.jpg`)
    ]);

    // Update band with image URLs
    await databases.updateDocument(
      DATABASE_ID,
      BANDS_COLLECTION,
      savedBand.$id,
      {
        logoUrl: logoUrl || '',
        albumCoverUrl: albumCoverUrl || '',
        bandPhotoUrl: bandPhotoUrl || ''
      }
    );

    // Create song records in database
    if (songStubs && songStubs.length > 0) {
      for (const stub of songStubs) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            SONGS_COLLECTION,
            ID.unique(),
            {
              bandId: savedBand.$id,
              title: stub.title,
              trackNumber: stub.trackNumber,
              description: stub.description,
              musicalElements: '',
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

    // Return the complete band data
    const completeBand = {
      ...savedBand,
      profileData: bandData,
      logoUrl,
      albumCoverUrl,
      bandPhotoUrl
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(completeBand)
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