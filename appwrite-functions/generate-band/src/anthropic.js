import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate a complete band profile
   * @param {string} userPrompt - The user's band concept
   * @returns {Promise<object>} The band profile
   */
  async generateBandProfile(userPrompt) {
    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: this.getSystemPrompt(),
      messages: [{
        role: "user",
        content: userPrompt
      }]
    });
    
    const profileText = message.content[0].text;
    const cleanedText = profileText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  }

  /**
   * Normalize AI description to 180-200 characters
   * @param {object} bandProfile
   * @returns {string}
   */
  normalizeAiDescription(bandProfile) {
    const current = bandProfile.aiDescription;
    
    if (current && current.length >= 180 && current.length <= 200) {
      return current;
    }
    
    const baseAiDesc = `${bandProfile.primaryGenre} band with ${bandProfile.vocalStyle.type}. ${bandProfile.coreSound}`;
    
    if (baseAiDesc.length > 200) {
      return baseAiDesc.substring(0, 197) + '...';
    }
    if (baseAiDesc.length < 180) {
      return baseAiDesc + ' Creating authentic music with passion and energy.';
    }
    
    return baseAiDesc;
  }

  getSystemPrompt() {
    return `You are a creative music industry professional helping to create fictional band profiles.
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
- Ensure all track names are unique and fit the band's and album concept`;
  }
}

export default AnthropicService;