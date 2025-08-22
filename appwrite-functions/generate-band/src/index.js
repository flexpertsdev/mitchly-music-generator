/**
 * Generate Band Function
 * Triggered when a new band document is created with status 'draft'
 * 
 * This function:
 * 1. Generates band profile using Anthropic
 * 2. Creates an album record
 * 3. Creates song stubs
 * 4. Generates visual assets using FAL.ai
 * 5. Updates band status to 'published' when complete
 */
import Anthropic from '@anthropic-ai/sdk';
import { Client, Databases, ID } from 'node-appwrite';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const ALBUMS_COLLECTION = 'albums';
const SONGS_COLLECTION = 'songs';

// Helper function to validate required environment variables
function validateEnvironment(env, required) {
  const missing = [];
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default async ({ req, res, log, error }) => {
  try {
    // For GET requests, return a simple status page
    if (req.method === 'GET') {
      return res.text(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Generate Band Function</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { padding: 20px; background: #f0f0f0; border-radius: 8px; }
            code { background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Generate Band Function</h1>
          <div class="status">
            <h2>Status: Active</h2>
            <p>This function is triggered by Appwrite events when a band document is created with status <code>draft</code>.</p>
            <h3>Event Pattern:</h3>
            <code>databases.${DATABASE_ID}.collections.${BANDS_COLLECTION}.documents.*.create</code>
            <h3>Required Environment Variables:</h3>
            <ul>
              <li>ANTHROPIC_API_KEY</li>
              <li>FAL_API_KEY (optional for image generation)</li>
            </ul>
          </div>
        </body>
        </html>
      `, 200, { 'Content-Type': 'text/html; charset=utf-8' });
    }

    // Handle POST requests (events)
    if (req.method !== 'POST') {
      return res.json({ success: false, error: 'Method not allowed' }, 405);
    }

    // Validate environment variables
    validateEnvironment(process.env, ['ANTHROPIC_API_KEY']);

    // Parse the event data - Appwrite sends events in a specific format
    const eventData = req.body;
    
    // Extract the document from the event
    // For document.create events, the document is in the event body
    const document = eventData;
    
    // Validate this is a band document in draft status
    if (!document.$id) {
      return res.json({ success: false, message: 'Invalid event data - no document ID' });
    }
    
    if (document.$collection !== BANDS_COLLECTION) {
      return res.json({ success: false, message: 'Not a band collection event' });
    }
    
    if (document.status !== 'draft') {
      return res.json({ success: false, message: 'Band is not in draft status' });
    }
    
    const bandId = document.$id;
    const userPrompt = document.userPrompt || document.prompt || 'Create a unique band concept';
    
    log(`Processing band generation for ID: ${bandId}`);
    log(`User prompt: ${userPrompt}`);
    
    // Initialize Appwrite client with dynamic API key
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key']); // Use dynamic API key from headers
    
    const databases = new Databases(client);
    
    // Update band status to generating
    try {
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        { status: 'generating' }
      );
      log('Updated band status to generating');
    } catch (updateError) {
      error(`Failed to update band status: ${updateError.message}`);
      return res.json({ success: false, error: 'Failed to update band status' });
    }
    
    // Initialize Anthropic
    const anthropic = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
    
    // Generate band profile with Anthropic
    log('Generating band profile with Anthropic...');
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
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
    "description": "string (2-3 sentences)",
    "themes": ["string", "string", "string"],
    "narrative": "string (album narrative arc)"
  },
  "trackListing": [
    {
      "title": "string",
      "theme": "string",
      "description": "string (50-100 chars)"
    }
  ],
  "aiDescription": "string (EXACTLY 180-200 characters describing the band's musical style for AI music generation)",
  "productionStyle": "string (describe production approach)",
  "formationStory": {
    "howMet": "string (how the band members met)",
    "earlyDays": "string (early days of the band)",
    "breakthrough": "string (breakthrough moment)"
  },
  "visualIdentityStyle": "string (overall visual identity approach)",
  "bandAiInstructions": "string (500-1000 chars - AI instructions for maintaining band's unique voice and style)",
  "albumAiInstructions": "string (500-1000 chars - AI instructions for this specific album's themes and mood)"
}

Important requirements:
- Generate 10-12 unique tracks with titles, themes, and descriptions
- AI description must be EXACTLY 180-200 characters for music generation platforms
- Include detailed formation story
- Include production style description
- bandAiInstructions should guide future AI generation to maintain consistency
- albumAiInstructions should be specific to this album's concept
- Ensure all track names are unique and fit the band's and album concept`,
        messages: [{
          role: "user",
          content: userPrompt
        }]
      });
      
      const profileText = message.content[0].text;
      const cleanedText = profileText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const bandProfile = JSON.parse(cleanedText);
      
      log('Band profile generated successfully');
      
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
      
      // Update band with generated profile
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        {
          bandName: bandProfile.bandName,
          primaryGenre: bandProfile.primaryGenre,
          profileData: JSON.stringify(bandProfile),
          origin: bandProfile.origin || '',
          formationYear: bandProfile.formationYear || new Date().getFullYear(),
          aiInstructions: bandProfile.bandAiInstructions || '',
          logoPrompt,
          albumTitle: bandProfile.albumConcept.title,
          albumDescription: bandProfile.albumConcept.description,
          trackCount: bandProfile.trackListing.length
        }
      );
      
      log('Band document updated with profile data');
      
      // Create album record
      const album = await databases.createDocument(
        DATABASE_ID,
        ALBUMS_COLLECTION,
        ID.unique(),
        {
          bandId: bandId,
          title: bandProfile.albumConcept.title,
          description: bandProfile.albumConcept.description,
          concept: bandProfile.albumConcept.narrative || '',
          trackCount: bandProfile.trackListing.length,
          aiInstructions: bandProfile.albumAiInstructions || '',
          status: 'draft',
          coverPrompt: albumCoverPrompt
        }
      );
      
      log(`Album created with ID: ${album.$id}`);
      
      // Create song stubs
      const songPromises = bandProfile.trackListing.map(async (track, index) => {
        return databases.createDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          ID.unique(),
          {
            bandId: bandId,
            albumId: album.$id,
            title: track.title,
            trackNumber: index + 1,
            description: track.description || '',
            lyrics: '', // Will be generated later
            status: 'pending',
            artistDescription: bandProfile.aiDescription,
            aiInstructions: `Theme: ${track.theme}. ${track.description}` // Song-specific context
          }
        );
      });
      
      await Promise.all(songPromises);
      log(`${bandProfile.trackListing.length} song stubs created`);
      
      // Generate images using FAL.ai if API key is available
      let visualAssets = {
        logoUrl: '',
        albumCoverUrl: '',
        bandPhotoUrl: ''
      };
      
      if (process.env.FAL_API_KEY) {
        try {
          const falHeaders = {
            'Authorization': `Key ${process.env.FAL_API_KEY}`,
            'Content-Type': 'application/json'
          };
          
          log('Generating visual assets with FAL.ai...');
          
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
            }).then(r => r.json()).catch(e => {
              log(`Logo generation failed: ${e.message}`);
              return null;
            }),
            
            fetch('https://fal.run/fal-ai/flux/schnell', {
              method: 'POST',
              headers: falHeaders,
              body: JSON.stringify({
                prompt: albumCoverPrompt,
                image_size: 'square',
                num_images: 1
              })
            }).then(r => r.json()).catch(e => {
              log(`Album cover generation failed: ${e.message}`);
              return null;
            }),
            
            fetch('https://fal.run/fal-ai/flux/schnell', {
              method: 'POST',
              headers: falHeaders,
              body: JSON.stringify({
                prompt: bandPhotoPrompt,
                image_size: 'landscape_16_9',
                num_images: 1
              })
            }).then(r => r.json()).catch(e => {
              log(`Band photo generation failed: ${e.message}`);
              return null;
            })
          ]);
          
          // Extract URLs
          visualAssets.logoUrl = logoResponse?.images?.[0]?.url || '';
          visualAssets.albumCoverUrl = albumResponse?.images?.[0]?.url || '';
          visualAssets.bandPhotoUrl = photoResponse?.images?.[0]?.url || '';
          
          log('Visual assets generation completed');
        } catch (imageError) {
          error(`Image generation error: ${imageError.message}`);
        }
      } else {
        log('FAL_API_KEY not set, skipping image generation');
      }
      
      // Update band with image URLs and mark as published
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        {
          logoUrl: visualAssets.logoUrl,
          albumCoverUrl: visualAssets.albumCoverUrl,
          bandPhotoUrl: visualAssets.bandPhotoUrl,
          status: 'published'
        }
      );
      
      // Update album with cover URL if available
      if (visualAssets.albumCoverUrl) {
        await databases.updateDocument(
          DATABASE_ID,
          ALBUMS_COLLECTION,
          album.$id,
          {
            coverUrl: visualAssets.albumCoverUrl,
            status: 'completed'
          }
        );
      }
      
      log('Band generation completed successfully');
      
      return res.json({
        success: true,
        bandId: bandId,
        albumId: album.$id,
        songCount: bandProfile.trackListing.length,
        message: 'Band generation completed successfully'
      });
      
    } catch (aiError) {
      error(`AI generation error: ${aiError.message}`);
      
      // Update band status to failed
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        {
          status: 'failed',
          generationError: aiError.message
        }
      );
      
      return res.json({
        success: false,
        error: `AI generation failed: ${aiError.message}`
      });
    }
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};
