import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  constructor() {
    this.client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
  }

  /**
   * Generate lyrics based on band and song context
   * @param {object} context
   * @returns {Promise<object>}
   */
  async generateLyrics(context) {
    const { bandProfile, songDetails } = context;
    
    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4000,
      temperature: 0.8,
      system: this.getSystemPrompt(bandProfile, songDetails),
      messages: [{
        role: "user",
        content: this.getUserPrompt(songDetails)
      }]
    });
    
    const responseText = message.content[0].text;
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      // If JSON parsing fails, try to extract lyrics manually
      console.error('Failed to parse JSON response, attempting manual extraction');
      return this.extractLyricsManually(responseText);
    }
  }

  getSystemPrompt(bandProfile, songDetails) {
    const genre = bandProfile?.primaryGenre || 'Alternative';
    const vocalStyle = bandProfile?.vocalStyle?.type || 'Dynamic vocals';
    const influences = bandProfile?.influences?.join(', ') || 'Various influences';
    
    return `You are an expert songwriter creating lyrics for a ${genre} band.

Band Context:
- Genre: ${genre}
- Vocal Style: ${vocalStyle}
- Core Sound: ${bandProfile?.coreSound || 'Alternative sound'}
- Influences: ${influences}
- Lyrical Themes: ${bandProfile?.lyricalThemes?.join(', ') || 'Various themes'}
${bandProfile?.albumConcept ? `- Album: "${bandProfile.albumConcept.title}" - ${bandProfile.albumConcept.description}` : ''}
${bandProfile?.bandAiInstructions ? `\nBand Instructions: ${bandProfile.bandAiInstructions}` : ''}

Create complete song lyrics with:
1. A brief song description (under 100 characters) for AI music platforms that is complementary to the banrd and album descriptions, focusing on the specific elements of the song and relative characteristics.
2. Full lyrics with proper song structure

The song should:
- Match the band's established style and genre
- Use section tags: [Intro], [Verse], [Pre-Chorus],  [Chorus], [Break]. [Bridge], [Outro]
- Be ready for AI music generation
- Feel authentic to the band's identity

Respond with valid JSON in this exact format:
{
  "songDescription": "Brief description under 100 characters about tempo, mood, and style",
  "lyrics": "Complete lyrics with sections like:\\n[Intro]\\nLyrics here\\n\\n[Verse 1]\\nLyrics here\\n\\n[Chorus]\\nLyrics here"
}`;
  }

  getUserPrompt(songDetails) {
    return `Create lyrics for Track ${songDetails.trackNumber}: "${songDetails.title}"

Song Context:
- Title: ${songDetails.title}
- Track Number: ${songDetails.trackNumber}
${songDetails.description ? `- Description: ${songDetails.description}` : ''}
${songDetails.aiInstructions ? `- Instructions: ${songDetails.aiInstructions}` : ''}
${songDetails.artistDescription ? `- Artist Style: ${songDetails.artistDescription}` : ''}

Generate complete, professional lyrics that tell a compelling story or convey powerful emotions.`;
  }

  extractLyricsManually(text) {
    // Fallback extraction if JSON parsing fails
    const descMatch = text.match(/"songDescription":\s*"([^"]+)"/);
    const lyricsMatch = text.match(/"lyrics":\s*"([\s\S]+?)"\s*\}/);
    
    return {
      songDescription: descMatch ? descMatch[1] : "Alternative rock song with dynamic energy",
      lyrics: lyricsMatch ? lyricsMatch[1].replace(/\\n/g, '\n') : text
    };
  }
}

export default AnthropicService;