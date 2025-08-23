class FalService {
  constructor() {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }
    
    this.apiKey = process.env.FAL_API_KEY;
    this.baseUrl = 'https://fal.run/fal-ai';
  }

  /**
   * Generate band profile image
   * @param {object} bandProfile - The band profile data
   * @returns {Promise<string>} The generated image URL
   */
  async generateBandImage(bandProfile) {
    const prompt = this.buildBandImagePrompt(bandProfile);
    
    try {
      const response = await this.generateImage(prompt);
      return response.images[0].url;
    } catch (error) {
      console.error('Failed to generate band image:', error);
      throw new Error(`Band image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate album cover image
   * @param {object} bandProfile - The band profile data
   * @returns {Promise<string>} The generated image URL
   */
  async generateAlbumCover(bandProfile) {
    const prompt = this.buildAlbumCoverPrompt(bandProfile);
    
    try {
      const response = await this.generateImage(prompt);
      return response.images[0].url;
    } catch (error) {
      console.error('Failed to generate album cover:', error);
      throw new Error(`Album cover generation failed: ${error.message}`);
    }
  }

  /**
   * Core image generation method
   * @param {string} prompt - The image generation prompt
   * @returns {Promise<object>} The FAL API response
   */
  async generateImage(prompt) {
    const response = await fetch(`${this.baseUrl}/flux-pro`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
        seed: Math.floor(Math.random() * 10000000)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FAL API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Build prompt for band profile image
   * @param {object} bandProfile 
   * @returns {string}
   */
  buildBandImagePrompt(bandProfile) {
    const styleKeywords = this.extractStyleKeywords(bandProfile);
    const colorPalette = this.extractColorPalette(bandProfile);
    
    return `${bandProfile.bandName} band promotional photo, ${bandProfile.primaryGenre} music group, ` +
           `${bandProfile.visualIdentity.aesthetic}, ${bandProfile.visualIdentity.style}, ` +
           `${styleKeywords}, ${colorPalette}, professional band photography, ` +
           `high quality, artistic composition, magazine quality, authentic band photo`;
  }

  /**
   * Build prompt for album cover
   * @param {object} bandProfile 
   * @returns {string}
   */
  buildAlbumCoverPrompt(bandProfile) {
    const albumTheme = bandProfile.albumConcept?.themes?.join(', ') || 'artistic';
    const visualStyle = bandProfile.visualIdentity?.style || 'modern';
    
    return `Album cover art for "${bandProfile.albumConcept.title}" by ${bandProfile.bandName}, ` +
           `${bandProfile.primaryGenre} album artwork, ${albumTheme} themes, ` +
           `${visualStyle} aesthetic, ${bandProfile.visualIdentity.colors}, ` +
           `professional album cover design, artistic, high quality, music industry standard, ` +
           `no text, symbolic imagery, ${bandProfile.visualIdentity.aesthetic}`;
  }

  /**
   * Extract style keywords from band profile
   * @param {object} bandProfile 
   * @returns {string}
   */
  extractStyleKeywords(bandProfile) {
    const keywords = [];
    
    if (bandProfile.visualIdentity?.aesthetic) {
      keywords.push(bandProfile.visualIdentity.aesthetic);
    }
    
    if (bandProfile.primaryGenre) {
      keywords.push(`${bandProfile.primaryGenre} aesthetic`);
    }
    
    if (bandProfile.origin) {
      keywords.push(`${bandProfile.origin} music scene`);
    }
    
    return keywords.join(', ');
  }

  /**
   * Extract color palette from band profile
   * @param {object} bandProfile 
   * @returns {string}
   */
  extractColorPalette(bandProfile) {
    if (bandProfile.visualIdentity?.colors) {
      return `color palette: ${bandProfile.visualIdentity.colors}`;
    }
    
    // Default color palettes based on genre
    const genreColors = {
      'rock': 'dark tones, red and black',
      'pop': 'bright vibrant colors',
      'indie': 'muted pastels, earth tones',
      'electronic': 'neon colors, cyan and magenta',
      'metal': 'black, silver, dark red',
      'jazz': 'warm browns, gold, deep blues',
      'folk': 'natural earth tones, forest greens',
      'punk': 'high contrast black and neon',
      'alternative': 'moody blues and purples'
    };
    
    const genre = bandProfile.primaryGenre?.toLowerCase() || 'alternative';
    return `color palette: ${genreColors[genre] || genreColors['alternative']}`;
  }
}

export default FalService;