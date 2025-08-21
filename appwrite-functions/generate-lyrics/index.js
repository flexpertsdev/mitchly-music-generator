import { Client, Databases } from 'node-appwrite';
import Anthropic from '@anthropic-ai/sdk';

export default async ({ req, res, log, error }) => {
  try {
    // Parse the event data
    const payload = JSON.parse(req.body);
    const document = payload.$response;
    
    // Only process if status changed to 'generating'
    if (document.status !== 'generating') {
      return res.json({ success: true, message: 'Not generating status' });
    }
    
    log('Starting lyrics generation for song:', document.$id);
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Initialize Anthropic
    const anthropic = new Anthropic({
      apiKey: req.variables.ANTHROPIC_API_KEY
    });
    
    // Get band profile if we have bandId
    let bandProfile = document.bandProfile;
    if (!bandProfile && document.bandId) {
      try {
        const band = await databases.getDocument(
          'mitchly-music-db',
          'bands',
          document.bandId
        );
        bandProfile = band;
      } catch (e) {
        log('Could not fetch band profile:', e.message);
      }
    }
    
    // Build the prompt
    const prompt = `You are an expert songwriter creating Track ${document.trackNumber}: "${document.title}" for the band ${bandProfile?.bandName || 'Unknown Band'}.

Band Profile Context:
- Genre: ${bandProfile?.primaryGenre || 'Rock'}
- Core Sound: ${bandProfile?.coreSound || 'Alternative'}
- Vocal Style: ${bandProfile?.vocalStyle?.type || bandProfile?.vocalStyle || 'Dynamic'}
- Album: ${bandProfile?.albumConcept?.title || 'Untitled Album'}
- Album Theme: ${bandProfile?.albumConcept?.description || 'No description'}
- Lyrical Themes: ${bandProfile?.lyricalThemes?.join(', ') || 'General themes'}
- Musical Influences: ${bandProfile?.influences?.join(', ') || 'Various influences'}

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
  "lyrics": "Complete song lyrics with proper sectioning:\\n\\n[Intro]\\n(description)\\nlyrics\\n\\n[Verse 1]\\nlyrics\\n\\n[Pre-Chorus]\\nlyrics\\n\\n[Chorus]\\nlyrics\\n\\n[Verse 2]\\nlyrics\\n\\n[Bridge]\\nlyrics\\n\\n[Final Chorus]\\nlyrics\\n\\n[Outro]\\nlyrics"
}`;

    log('Calling Anthropic API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0].text;
    log('Received response from Anthropic');
    
    // Clean up the response
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\n?/g, '');
    }
    
    // Parse the JSON
    const song = JSON.parse(cleanContent.trim());
    
    // Update the document with generated lyrics
    await databases.updateDocument(
      'mitchly-music-db',
      'songs',
      document.$id,
      {
        lyrics: song.lyrics,
        description: song.songDescription,
        artistDescription: bandProfile?.aiDescription || `${bandProfile?.bandName || 'Unknown Band'} - ${bandProfile?.primaryGenre || 'Rock'}`,
        status: 'completed',
        lyricsGeneratedAt: new Date().toISOString()
      }
    );
    
    log('Successfully updated song with lyrics');
    
    return res.json({
      success: true,
      songId: document.$id
    });
    
  } catch (err) {
    error('Error generating lyrics:', err);
    
    // Try to update the document with error status
    try {
      const client = new Client()
        .setEndpoint(req.variables.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(req.variables.APPWRITE_PROJECT_ID || 'flexos')
        .setKey(req.variables.APPWRITE_API_KEY);
      
      const databases = new Databases(client);
      const payload = JSON.parse(req.body);
      
      await databases.updateDocument(
        'mitchly-music-db',
        'songs',
        payload.$response.$id,
        {
          status: 'failed',
          generationError: err.message || 'Unknown error'
        }
      );
    } catch (updateErr) {
      error('Failed to update error status:', updateErr);
    }
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
