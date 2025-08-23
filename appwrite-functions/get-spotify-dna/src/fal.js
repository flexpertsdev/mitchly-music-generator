/**
 * FAL.ai integration for image generation
 */

/**
 * Generates an album cover using FAL.ai
 * @param {object} concept - Band concept
 * @param {string} falApiKey - FAL API key
 * @returns {Promise<object>} Generated image data
 */
export async function generateAlbumCover(concept, falApiKey) {
  if (!falApiKey) {
    return null;
  }

  try {
    const prompt = `Album cover for "${concept.albumTitle}" by ${concept.name}. ${concept.albumCoverPrompt}. Style: professional album artwork, high quality, ${concept.genre} aesthetic, ${concept.vibe}. Clean typography space for album title.`;
    
    const response = await fetch("https://fal.run/fal-ai/flux-pro", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      url: result.images?.[0]?.url || null,
      prompt: prompt,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Album cover generation failed:', error);
    return null;
  }
}

/**
 * Generates a band photo using FAL.ai
 * @param {object} concept - Band concept
 * @param {string} falApiKey - FAL API key
 * @returns {Promise<object>} Generated image data
 */
export async function generateBandPhoto(concept, falApiKey) {
  if (!falApiKey) {
    return null;
  }

  try {
    const prompt = `Professional band promotional photo for ${concept.name}. ${concept.bandPhotoPrompt}. Style: high-quality music photography, ${concept.genre} band aesthetic, ${concept.vibe}. Studio lighting, professional composition.`;
    
    const response = await fetch("https://fal.run/fal-ai/flux-pro", {
      method: "POST", 
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      url: result.images?.[0]?.url || null,
      prompt: prompt,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Band photo generation failed:', error);
    return null;
  }
}