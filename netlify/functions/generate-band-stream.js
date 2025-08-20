// netlify/functions/generate-band-stream.js
import Anthropic from '@anthropic-ai/sdk';
import { ID, Client, Databases, Storage, InputFile } from 'node-appwrite';

// Progress messages with emojis
const PROGRESS_MESSAGES = [
  { step: 'start', message: '🎸 Starting the creative process...', progress: 5 },
  { step: 'analyzing', message: '🤔 Analyzing your musical vision...', progress: 10 },
  { step: 'band_identity', message: '🎤 Creating band identity...', progress: 20 },
  { step: 'backstory', message: '📖 Writing our origin story...', progress: 30 },
  { step: 'visual_identity', message: '🎨 Designing visual aesthetic...', progress: 40 },
  { step: 'album_concept', message: '💿 Brainstorming album concept...', progress: 50 },
  { step: 'track_listing', message: '🎵 Coming up with killer tracks...', progress: 60 },
  { step: 'generating_logo', message: '✨ Creating a wicked logo...', progress: 70 },
  { step: 'photo_shoot', message: '📸 Having our first photo shoot...', progress: 80 },
  { step: 'album_cover', message: '🎨 Designing album artwork...', progress: 90 },
  { step: 'finalizing', message: '🚀 Finalizing everything...', progress: 95 },
  { step: 'complete', message: '🎉 Band profile complete!', progress: 100 }
];

// SSE helper to send progress
const sendProgress = (step, customMessage = null) => {
  const progressInfo = PROGRESS_MESSAGES.find(p => p.step === step) || { message: 'Working...', progress: 50 };
  const message = customMessage || progressInfo.message;
  
  return `data: ${JSON.stringify({ 
    type: 'progress', 
    step, 
    message, 
    progress: progressInfo.progress 
  })}\n\n`;
};

const sendError = (error) => {
  return `data: ${JSON.stringify({ 
    type: 'error', 
    message: error 
  })}\n\n`;
};

const sendComplete = (data) => {
  return `data: ${JSON.stringify({ 
    type: 'complete', 
    data 
  })}\n\n`;
};

export default async function handler(req, context) {
  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers 
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { prompt, advancedData } = await req.json();
        
        // Send initial progress
        controller.enqueue(new TextEncoder().encode(sendProgress('start')));
        
        if (!prompt) {
          throw new Error('Prompt is required');
        }

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

        controller.enqueue(new TextEncoder().encode(sendProgress('analyzing')));

        // Initialize Anthropic
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        controller.enqueue(new TextEncoder().encode(sendProgress('band_identity')));

        // Generate band profile
        const message = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2000,
          temperature: 0.9,
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
  "productionStyle": "string (describe production approach)"
}

Important requirements:
- Band backstory (2-3 sentences)
- Visual identity (colors, aesthetic, logo concept)
- Lyrical themes (5-6 themes)
- Album concept with title and description
- 8-12 track titles that fit the concept and create a cohesive musical experience
- AI description (exactly 180-200 characters for music generation platforms)
- Production style description
- Detailed song stubs for each track

Ensure all track names are unique and fit the band's concept.`,
          messages: [{
            role: "user",
            content: fullPrompt
          }]
        });

        controller.enqueue(new TextEncoder().encode(sendProgress('backstory')));

        const profileText = message.content[0].text;
        const cleanedText = profileText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const bandProfile = JSON.parse(cleanedText);

        controller.enqueue(new TextEncoder().encode(sendProgress('visual_identity')));

        // Generate visual prompts
        const logoPrompt = `Band logo for "${bandProfile.bandName}": ${bandProfile.visualIdentity.logo}. Style: ${bandProfile.visualIdentity.aesthetic}. Colors: ${bandProfile.visualIdentity.colors}. Clean, iconic, suitable for merchandise.`;
        
        const albumCoverPrompt = `Album cover for "${bandProfile.albumConcept.title}" by ${bandProfile.bandName}: ${bandProfile.albumConcept.description}. Visual style: ${bandProfile.visualIdentity.aesthetic}. ${bandProfile.primaryGenre} aesthetic.`;
        
        const bandPhotoPrompt = `Professional band photo of ${bandProfile.bandName}: ${bandProfile.backstory}. ${bandProfile.visualIdentity.style} aesthetic. ${bandProfile.vocalStyle.description}.`;

        controller.enqueue(new TextEncoder().encode(sendProgress('album_concept')));

        // Song stubs for detailed track information
        // Ensure each song description is under 100 characters for Mureka
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

        controller.enqueue(new TextEncoder().encode(sendProgress('track_listing')));

        // Initialize Appwrite
        const client = new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT)
          .setProject(process.env.APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);
        const storage = new Storage(client);

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
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_BANDS_COLLECTION_ID,
          ID.unique(),
          {
            name: bandProfile.bandName,
            profileData: JSON.stringify(bandData),
            createdAt: new Date().toISOString()
          }
        );

        controller.enqueue(new TextEncoder().encode(sendProgress('generating_logo')));

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
          }).then(r => r.json()),
          
          controller.enqueue(new TextEncoder().encode(sendProgress('album_cover'))) && 
          fetch('https://fal.run/fal-ai/flux/schnell', {
            method: 'POST',
            headers: falHeaders,
            body: JSON.stringify({
              prompt: albumCoverPrompt,
              image_size: 'square',
              num_images: 1
            })
          }).then(r => r.json()),
          
          controller.enqueue(new TextEncoder().encode(sendProgress('photo_shoot'))) &&
          fetch('https://fal.run/fal-ai/flux/schnell', {
            method: 'POST',
            headers: falHeaders,
            body: JSON.stringify({
              prompt: bandPhotoPrompt,
              image_size: 'landscape_16_9',
              num_images: 1
            })
          }).then(r => r.json())
        ]);

        controller.enqueue(new TextEncoder().encode(sendProgress('finalizing')));

        // Download and upload images to Appwrite storage
        const uploadImage = async (imageUrl, fileName) => {
          if (!imageUrl) return null;
          
          try {
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            
            const file = await storage.createFile(
              process.env.APPWRITE_STORAGE_BUCKET_ID,
              ID.unique(),
              InputFile.fromBuffer(new Uint8Array(imageBuffer), fileName)
            );
            
            // Get the file URL
            const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_STORAGE_BUCKET_ID}/files/${file.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
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
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_BANDS_COLLECTION_ID,
          savedBand.$id,
          {
            logoUrl: logoUrl || '',
            albumCoverUrl: albumCoverUrl || '',
            bandPhotoUrl: bandPhotoUrl || ''
          }
        );

        controller.enqueue(new TextEncoder().encode(sendProgress('complete')));

        // Return the complete band data
        const completeBand = {
          ...savedBand,
          profileData: bandData,
          logoUrl,
          albumCoverUrl,
          bandPhotoUrl
        };

        controller.enqueue(new TextEncoder().encode(sendComplete(completeBand)));
        controller.close();

      } catch (error) {
        console.error('Error:', error);
        controller.enqueue(new TextEncoder().encode(sendError(error.message)));
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
}

export const config = {
  path: "/api/generate-band-stream"
};