import * as fal from '@fal-ai/serverless-client';

class FalService {
  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
    if (this.apiKey) {
      fal.config({
        credentials: this.apiKey
      });
    }
  }

  /**
   * Check if FAL API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Generate image using FAL.ai
   * @param {string} prompt
   * @param {string} imageSize
   * @returns {Promise<string|null>}
   */
  async generateImage(prompt, imageSize = 'square') {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt,
          image_size: imageSize,
          num_images: 1
        }
      });
      
      return result?.images?.[0]?.url || null;
    } catch (error) {
      console.error(`FAL.ai generation error: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate all band visuals
   * @param {object} prompts
   * @returns {Promise<object>}
   */
  async generateBandVisuals(prompts) {
    if (!this.isConfigured()) {
      return {
        logoUrl: '',
        albumCoverUrl: '',
        bandPhotoUrl: ''
      };
    }

    const [logoUrl, albumCoverUrl, bandPhotoUrl] = await Promise.all([
      this.generateImage(prompts.logo, 'square'),
      this.generateImage(prompts.albumCover, 'square'),
      this.generateImage(prompts.bandPhoto, 'landscape_16_9')
    ]);

    return {
      logoUrl: logoUrl || '',
      albumCoverUrl: albumCoverUrl || '',
      bandPhotoUrl: bandPhotoUrl || ''
    };
  }
}

export default FalService;