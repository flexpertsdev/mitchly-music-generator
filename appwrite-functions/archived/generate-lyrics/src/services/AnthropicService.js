import Anthropic from '@anthropic-ai/sdk';
import { FUNCTION_CONFIG } from '../config.js';

export class AnthropicService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.client = new Anthropic({ apiKey });
  }
  
  /**
   * Generate lyrics based on band and song context
   * @param {Object} context - The context for lyrics generation
   * @returns {Promise<{songDescription: string, lyrics: string}>}
   */
  async generateLyrics(context) {
    const { bandProfile, songDetails } = context;
    
    const prompt = this.buildPrompt(bandProfile, songDetails);
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      const content = response.content[0].text;
      
      // Clean and parse response
      const cleanContent = this.cleanJsonResponse(content);
      return JSON.parse(cleanContent);
    } catch (error) {
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }
  
  buildPrompt(bandProfile, songDetails) {
    return `You are an expert songwriter creating lyrics for Track ${songDetails.trackNumber}: "${songDetails.title}" for the band ${bandProfile?.bandName || 'Unknown Band'}.

Band Profile Context:
- Genre: ${bandProfile?.primaryGenre || songDetails.primaryGenre || 'Rock'}
- Core Sound: ${bandProfile?.coreSound || 'Alternative'}
- Vocal Style: ${bandProfile?.vocalStyle?.type || 'Dynamic'}
- Album: ${bandProfile?.albumConcept?.title || 'Untitled Album'}
- Album Theme: ${bandProfile?.albumConcept?.description || 'No description'}
- Lyrical Themes: ${bandProfile?.lyricalThemes?.join(', ') || 'General themes'}
- Musical Influences: ${bandProfile?.influences?.join(', ') || 'Various influences'}

Song Context:
- Title: ${songDetails.title}
- Track Number: ${songDetails.trackNumber}
- Description: ${songDetails.description || 'No specific description'}
- AI Instructions: ${songDetails.aiInstructions || 'No specific instructions'}

Create a complete song with:
1. Song-specific description (under 100 characters for AI music platforms)
2. Complete lyrics with proper structure for AI music generation

The song should:
- Fit the band's style and the album's concept
- Have a unique theme that complements the overall album narrative
- Include proper song structure with [Intro], [Verse], [Chorus], [Bridge], [Outro] sections
- Match the vocal style and genre characteristics
- Be optimized for AI music generation platforms

Respond ONLY with valid JSON in this exact format:
{
  "songDescription": "Brief description under 100 characters about tempo, mood, and musical elements",
  "lyrics": "Complete song lyrics with proper sectioning:\\n\\n[Intro]\\n(instrumental description or lyrics)\\n\\n[Verse 1]\\nlyrics\\n\\n[Pre-Chorus]\\nlyrics\\n\\n[Chorus]\\nlyrics\\n\\n[Verse 2]\\nlyrics\\n\\n[Chorus]\\nlyrics\\n\\n[Bridge]\\nlyrics\\n\\n[Final Chorus]\\nlyrics\\n\\n[Outro]\\nlyrics"
}`;
  }
  
  cleanJsonResponse(content) {
    let cleanContent = content;
    
    // Remove markdown code blocks
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\n?/g, '');
    }
    
    return cleanContent.trim();
  }
}
