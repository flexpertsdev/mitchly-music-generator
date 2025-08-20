import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';

export default async (request, context) => {
  // Enable CORS
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  try {
    const { prompt, advancedData } = await request.json();
    
    if (!prompt) {
      return new Response('Prompt is required', { status: 400, headers });
    }

    // Create a TransformStream for SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Helper to send SSE events
    const sendEvent = async (data) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start the streaming process
    (async () => {
      try {
        // Send initial progress
        await sendEvent({ 
          type: 'progress', 
          step: 'start', 
          message: '🎸 Starting the creative process...', 
          progress: 5 
        });

        // Initialize Anthropic
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
        if (!apiKey) {
          throw new Error('API configuration error');
        }
        
        const anthropic = new Anthropic({ apiKey });

        await sendEvent({ 
          type: 'progress', 
          step: 'analyzing', 
          message: '🤔 Analyzing your musical vision...', 
          progress: 10 
        });

        // Combine prompt with advanced data
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

        await sendEvent({ 
          type: 'progress', 
          step: 'generating', 
          message: '🎤 Generating band profile with AI...', 
          progress: 20 
        });

        // Generate band profile with Anthropic
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
}`,
          messages: [{
            role: "user",
            content: fullPrompt
          }]
        });

        await sendEvent({ 
          type: 'progress', 
          step: 'parsing', 
          message: '📖 Processing band details...', 
          progress: 40 
        });

        const profileText = message.content[0].text;
        const cleanedText = profileText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const bandProfile = JSON.parse(cleanedText);

        // Generate visual prompts
        const logoPrompt = `Band logo for "${bandProfile.bandName}": ${bandProfile.visualIdentity.logo}. Style: ${bandProfile.visualIdentity.aesthetic}. Colors: ${bandProfile.visualIdentity.colors}. Clean, iconic, suitable for merchandise.`;
        
        const albumCoverPrompt = `Album cover for "${bandProfile.albumConcept.title}" by ${bandProfile.bandName}: ${bandProfile.albumConcept.description}. Visual style: ${bandProfile.visualIdentity.aesthetic}. ${bandProfile.primaryGenre} aesthetic.`;
        
        const bandPhotoPrompt = `Professional band photo of ${bandProfile.bandName}: ${bandProfile.backstory}. ${bandProfile.visualIdentity.style} aesthetic. ${bandProfile.vocalStyle.description}.`;

        await sendEvent({ 
          type: 'progress', 
          step: 'generating_logo', 
          message: '✨ Creating band logo...', 
          progress: 50 
        });

        // Generate images with fal.ai
        const falApiKey = Deno.env.get('FAL_API_KEY');
        const falHeaders = {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json'
        };

        // Generate logo
        const logoResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: falHeaders,
          body: JSON.stringify({
            prompt: logoPrompt,
            image_size: 'square',
            num_images: 1
          })
        });
        const logoData = await logoResponse.json();

        await sendEvent({ 
          type: 'progress', 
          step: 'generating_album', 
          message: '💿 Designing album cover...', 
          progress: 65 
        });

        // Generate album cover
        const albumResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: falHeaders,
          body: JSON.stringify({
            prompt: albumCoverPrompt,
            image_size: 'square',
            num_images: 1
          })
        });
        const albumData = await albumResponse.json();

        await sendEvent({ 
          type: 'progress', 
          step: 'generating_photo', 
          message: '📸 Taking band photo...', 
          progress: 80 
        });

        // Generate band photo
        const photoResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: falHeaders,
          body: JSON.stringify({
            prompt: bandPhotoPrompt,
            image_size: 'landscape_16_9',
            num_images: 1
          })
        });
        const photoData = await photoResponse.json();

        await sendEvent({ 
          type: 'progress', 
          step: 'saving', 
          message: '💾 Saving to database...', 
          progress: 90 
        });

        // Prepare the complete band data
        const completeData = {
          ...bandProfile,
          logoUrl: logoData?.images?.[0]?.url,
          albumCoverUrl: albumData?.images?.[0]?.url,
          bandPhotoUrl: photoData?.images?.[0]?.url,
          logoPrompt,
          albumCoverPrompt,
          bandPhotoPrompt,
          createdAt: new Date().toISOString()
        };

        await sendEvent({ 
          type: 'progress', 
          step: 'finalizing', 
          message: '🚀 Finalizing everything...', 
          progress: 95 
        });

        // Send completion with data
        await sendEvent({ 
          type: 'complete', 
          message: '🎉 Band profile complete!', 
          progress: 100,
          data: completeData,
          needsSaving: true // Flag to indicate client should save to Appwrite
        });

      } catch (error) {
        await sendEvent({ 
          type: 'error', 
          message: error.message 
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, { headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

export const config = {
  path: "/generate-band-stream-production"
};