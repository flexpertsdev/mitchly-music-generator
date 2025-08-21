/**
 * Generate Lyrics Function
 * Triggered when a song document is updated with status 'generating'
 * 
 * This function:
 * 1. Fetches band context
 * 2. Generates lyrics using Anthropic based on song theme
 * 3. Updates song with generated lyrics
 */
import { Client, Databases } from 'node-appwrite';
import Anthropic from '@anthropic-ai/sdk';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const SONGS_COLLECTION = 'songs';

export default async ({ req, res, log, error }) => {
  try {
    // Parse the event data
    const event = req.body;
    
    // Check if this is a song update event
    if (!event.$id || event.$collection !== SONGS_COLLECTION) {
      return res.json({ success: false, message: 'Not a song update event' });
    }
    
    // Only process if status changed to 'generating'
    if (event.status !== 'generating') {
      return res.json({ success: false, message: 'Not generating status' });
    }
    
    const songId = event.$id;
    log(`Starting lyrics generation for song: ${songId}`);
    
    // Initialize Appwrite client using built-in variables
    const client = new Client()
      .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.variables.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Initialize Anthropic
    const anthropic = new Anthropic({
      apiKey: req.variables.ANTHROPIC_API_KEY
    });
    
    // Get band profile if we have bandId
    let bandProfile = null;
    if (event.bandId) {
      try {
        const band = await databases.getDocument(
          DATABASE_ID,
          BANDS_COLLECTION,
          event.bandId
        );
        
        // Parse profile data if it's a string
        if (band.profileData) {
          bandProfile = typeof band.profileData === 'string' 
            ? JSON.parse(band.profileData) 
            : band.profileData;
        }
      } catch (e) {
        log('Could not fetch band profile:', e.message);
      }
    }
    
    // Build the prompt
    const prompt = `You are an expert songwriter creating lyrics for Track ${event.trackNumber}: "${event.title}" for the band ${bandProfile?.bandName || 'Unknown Band'}.

Band Profile Context:
- Genre: ${bandProfile?.primaryGenre || event.primaryGenre || 'Rock'}
- Core Sound: ${bandProfile?.coreSound || 'Alternative'}
- Vocal Style: ${bandProfile?.vocalStyle?.type || 'Dynamic'}
- Album: ${bandProfile?.albumConcept?.title || 'Untitled Album'}
- Album Theme: ${bandProfile?.albumConcept?.description || 'No description'}
- Lyrical Themes: ${bandProfile?.lyricalThemes?.join(', ') || 'General themes'}
- Musical Influences: ${bandProfile?.influences?.join(', ') || 'Various influences'}

Song Context:
- Title: ${event.title}
- Track Number: ${event.trackNumber}
- Description: ${event.description || 'No specific description'}
- AI Instructions: ${event.aiInstructions || 'No specific instructions'}

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

    log('Calling Anthropic API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      temperature: 0.8,
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
      DATABASE_ID,
      SONGS_COLLECTION,
      songId,
      {
        lyrics: song.lyrics,
        description: song.songDescription,
        status: 'completed',
        lyricsGeneratedAt: new Date().toISOString()
      }
    );
    
    log('Successfully updated song with lyrics');
    
    return res.json({
      success: true,
      songId: songId,
      message: 'Lyrics generated successfully'
    });
    
  } catch (err) {
    error('Error generating lyrics:', err.message);
    
    // Try to update the document with error status
    if (req.body?.$id) {
      try {
        const client = new Client()
          .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
          .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
          .setKey(req.variables.APPWRITE_API_KEY);
        
        const databases = new Databases(client);
        
        await databases.updateDocument(
          DATABASE_ID,
          SONGS_COLLECTION,
          req.body.$id,
          {
            status: 'failed',
            generationError: err.message || 'Unknown error'
          }
        );
      } catch (updateErr) {
        error('Failed to update error status:', updateErr.message);
      }
    }
    
    return res.json({
      success: false,
      error: err.message
    });
  }
};