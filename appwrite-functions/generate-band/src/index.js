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

export default async ({ req, res, log, error }) => {
  try {
    // Parse the event data
    const event = req.body;
    
    // Check if this is a band creation event
    if (!event.$id || event.$collection !== BANDS_COLLECTION) {
      return res.json({ success: false, message: 'Not a band creation event' });
    }
    
    // Check if band is in draft status
    if (event.status !== 'draft') {
      return res.json({ success: false, message: 'Band is not in draft status' });
    }
    
    const bandId = event.$id;
    const userPrompt = event.userPrompt || 'Create a unique band concept';
    
    log(`Processing band generation for ID: ${bandId}`);
    
    // Initialize Appwrite client - using built-in environment variables
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Update band status to generating
    await databases.updateDocument(
      DATABASE_ID,
      BANDS_COLLECTION,
      bandId,
      { status: 'generating' }
    );
    
    // Initialize Anthropic
    const anthropic = new Anthropic({ 
      apiKey: req.variables.ANTHROPIC_API_KEY 
    });
    
    // Generate band profile with Anthropic
    log('Generating band profile with Anthropic...');
    
    const message = await anthropic.messages.create({
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
- Generate 8-12 unique tracks with titles, themes, and descriptions
- AI description must be EXACTLY 180-200 characters for music generation platforms
- Include detailed formation story
- Include production style description
- bandAiInstructions should guide future AI generation to maintain consistency
- albumAiInstructions should be specific to this album's concept
- Ensure all track names are unique and fit the band's concept`,
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
    
    // Generate images using FAL.ai
    try {
      const falHeaders = {
        'Authorization': `Key ${req.variables.FAL_API_KEY}`,
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
      const logoUrl = logoResponse?.images?.[0]?.url || '';
      const albumCoverUrl = albumResponse?.images?.[0]?.url || '';
      const bandPhotoUrl = photoResponse?.images?.[0]?.url || '';
      
      // Update band with image URLs
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        {
          logoUrl: logoUrl || '',
          albumCoverUrl: albumCoverUrl || '',
          bandPhotoUrl: bandPhotoUrl || '',
          status: 'published' // Mark as published
        }
      );
      
      // Update album with cover URL
      if (albumCoverUrl) {
        await databases.updateDocument(
          DATABASE_ID,
          ALBUMS_COLLECTION,
          album.$id,
          {
            coverUrl: albumCoverUrl,
            status: 'completed'
          }
        );
      }
      
      log('Visual assets generated and saved');
      
    } catch (imageError) {
      error(`Image generation error: ${imageError.message}`);
      // Still mark as published even if images fail
      await databases.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        bandId,
        { status: 'published' }
      );
    }
    
    return res.json({
      success: true,
      bandId: bandId,
      albumId: album.$id,
      songCount: bandProfile.trackListing.length,
      message: 'Band generation completed successfully'
    });
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    
    // Try to update band status to failed
    if (req.body?.$id) {
      try {
        const client = new Client()
          .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
          .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
          .setKey(req.variables.APPWRITE_API_KEY);
        
        const databases = new Databases(client);
        
        await databases.updateDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          req.body.$id,
          {
            status: 'failed',
            generationError: err.message
          }
        );
      } catch (updateError) {
        error(`Failed to update band status: ${updateError.message}`);
      }
    }
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};