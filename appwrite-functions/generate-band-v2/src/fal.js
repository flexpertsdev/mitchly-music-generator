class FalService {
  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
    this.baseUrl = 'https://fal.run/fal-ai/flux/schnell';
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          image_size: imageSize,
          num_images: 1
        })
      });

      const data = await response.json();
      return data?.images?.[0]?.url || null;
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
