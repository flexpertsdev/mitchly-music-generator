// Fal.ai API Service for Image Generation
const FAL_API_URL = 'https://fal.run/fal-ai/flux/schnell';
const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

class FalAIService {
  constructor() {
    this.apiKey = FAL_API_KEY;
    this.headers = {
      'Authorization': `Key ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async generateImage(prompt, options = {}) {
    try {
      const response = await fetch(FAL_API_URL, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          prompt,
          image_size: options.size || 'square',
          num_inference_steps: options.steps || 4,
          num_images: options.num || 1,
          enable_safety_checker: true,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Fal.ai API error: ${response.status}`);
      }

      const result = await response.json();
      return result.images?.[0]?.url || null;
    } catch (error) {
      console.error('Error generating image with Fal.ai:', error);
      throw error;
    }
  }

  async generateBandLogo(bandProfile) {
    const prompt = `Minimalist band logo design for "${bandProfile.bandName}", ${bandProfile.primaryGenre} band. 
    Style: ${bandProfile.visualIdentity?.logo || 'modern and clean'}. 
    Colors: ${bandProfile.visualIdentity?.colors || 'vibrant and bold'}. 
    Professional music band logo, vector style, centered composition, high contrast.`;

    return this.generateImage(prompt, {
      size: 'square',
      steps: 6
    });
  }

  async generateAlbumCover(bandProfile) {
    const prompt = `Album cover art for "${bandProfile.albumConcept?.title || 'Album'}" by ${bandProfile.bandName}. 
    Genre: ${bandProfile.primaryGenre}. 
    Style: ${bandProfile.visualIdentity?.aesthetic || 'contemporary and artistic'}. 
    Themes: ${bandProfile.lyricalThemes?.join(', ') || 'emotional and powerful'}. 
    Professional album artwork, high quality, artistic composition.`;

    return this.generateImage(prompt, {
      size: 'square',
      steps: 8
    });
  }

  async generateBandPhoto(bandProfile) {
    const prompt = `Professional band photo for ${bandProfile.primaryGenre} band. 
    Style: ${bandProfile.visualIdentity?.style || 'dynamic and energetic'}. 
    Formation: ${bandProfile.formationYear || 'modern'} era aesthetic. 
    Atmosphere: ${bandProfile.coreSound || 'powerful and engaging'}. 
    High quality promotional band photography, dramatic lighting.`;

    return this.generateImage(prompt, {
      size: 'landscape',
      steps: 8
    });
  }

  async generateAllBandImages(bandProfile) {
    if (!this.apiKey) {
      console.warn('Fal.ai API key not configured. Skipping image generation.');
      return {
        logo: null,
        albumCover: null,
        bandPhoto: null
      };
    }

    try {
      const [logo, albumCover, bandPhoto] = await Promise.all([
        this.generateBandLogo(bandProfile),
        this.generateAlbumCover(bandProfile),
        this.generateBandPhoto(bandProfile)
      ]);

      return {
        logo,
        albumCover,
        bandPhoto
      };
    } catch (error) {
      console.error('Error generating band images:', error);
      return {
        logo: null,
        albumCover: null,
        bandPhoto: null
      };
    }
  }
}

export const falAIService = new FalAIService();