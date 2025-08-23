/**
 * Anthropic Claude integration for generating personalized band concepts
 */

import { generateAlbumCover, generateBandPhoto } from './fal.js';

/**
 * Generates band concepts based on musical DNA
 * @param {object} musicalDNA - User's musical DNA profile
 * @param {string} anthropicApiKey - Anthropic API key
 * @param {string} falApiKey - FAL API key (optional)
 * @returns {Promise<Array>} Array of band concepts
 */
export async function generateBandConcepts(musicalDNA, anthropicApiKey, falApiKey) {
  try {
    const prompt = createBandGenerationPrompt(musicalDNA);
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        temperature: 0.9,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let conceptsText = data.content[0].text;
    
    // Clean up the response to extract JSON
    conceptsText = conceptsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Find JSON array in the response
    const jsonMatch = conceptsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse band concepts from AI response');
    }
    
    const concepts = JSON.parse(jsonMatch[0]);
    
    // Generate images if FAL API key is provided
    if (falApiKey) {
      const conceptsWithImages = await addImagesToConc epts(concepts, falApiKey);
      return conceptsWithImages;
    }
    
    return concepts;

  } catch (error) {
    console.error('Failed to generate band concepts:', error);
    // Return fallback concepts
    return generateFallbackConcepts(musicalDNA);
  }
}

/**
 * Creates the prompt for band generation
 * @param {object} musicalDNA - Musical DNA profile
 * @returns {string} Formatted prompt
 */
function createBandGenerationPrompt(musicalDNA) {
  const { primaryGenres, audioProfile, aiSummary, quirks, temporalPatterns } = musicalDNA;
  
  const genreList = primaryGenres.map(g => `${g.genre} (${g.percentage.toFixed(1)}%)`).join(', ');
  const influences = aiSummary.topInfluences.slice(0, 5).join(', ');
  const quirksList = quirks.map(q => q.description).join(', ') || 'none detected';
  
  return `Based on this user's musical DNA, generate 5 unique band concepts that would be "their new favorite band":

MUSICAL PROFILE:
- Primary genres: ${genreList}
- Energy level: ${aiSummary.energyProfile}
- Emotional tone: ${aiSummary.emotionalTone}
- Tempo preference: ${aiSummary.tempoPreference}
- Top influences: ${influences}
- Musical quirks: ${quirksList}
- Listening behavior: ${temporalPatterns.behavior}

AUDIO CHARACTERISTICS:
- Danceability: ${(audioProfile.danceability * 100).toFixed(0)}%
- Energy: ${(audioProfile.energy * 100).toFixed(0)}%
- Valence (happiness): ${(audioProfile.valence * 100).toFixed(0)}%
- Acousticness: ${(audioProfile.acousticness * 100).toFixed(0)}%
- Instrumentalness: ${(audioProfile.instrumentalness * 100).toFixed(0)}%
- Average tempo: ${audioProfile.tempo.toFixed(0)} BPM

Create 5 band concepts that:
1. Blend their established tastes with fresh, unexpected elements
2. Feel like a natural evolution of their taste
3. Introduce something new they haven't heard before
4. Each concept should be distinct from the others
5. Should feel like potential "new favorite bands" not generic recommendations

Return ONLY a JSON array with this EXACT structure, no other text:
[
  {
    "name": "Band Name",
    "genre": "specific genre blend description (be creative and specific)",
    "description": "2-3 sentence description of their unique sound and what makes them special",
    "vibe": "one-sentence capturing the overall mood/atmosphere",
    "inspiration": "what if [known artist] met [other influence] in [unexpected setting]",
    "uniqueElement": "the specific fresh/unexpected element that makes this band special",
    "albumTitle": "Their Debut Album Title",
    "albumConcept": "Brief concept/theme of the album",
    "songTitles": ["Song 1", "Song 2", "Song 3"],
    "albumCoverPrompt": "Detailed visual description for album cover art - be specific about style, colors, elements",
    "bandPhotoPrompt": "Detailed description for band promotional photo - include setting, mood, styling"
  }
]`;
}

/**
 * Adds generated images to band concepts
 * @param {Array} concepts - Band concepts
 * @param {string} falApiKey - FAL API key
 * @returns {Promise<Array>} Concepts with images
 */
async function addImagesToConcepts(concepts, falApiKey) {
  const conceptsWithImages = await Promise.all(
    concepts.map(async (concept, index) => {
      try {
        // Generate images in parallel for each concept
        const [albumCover, bandPhoto] = await Promise.all([
          generateAlbumCover(concept, falApiKey),
          generateBandPhoto(concept, falApiKey)
        ]);
        
        return {
          ...concept,
          images: {
            albumCover,
            bandPhoto
          }
        };
      } catch (imageError) {
        console.error(`Failed to generate images for concept ${index}:`, imageError);
        return {
          ...concept,
          images: {
            albumCover: null,
            bandPhoto: null
          }
        };
      }
    })
  );
  
  return conceptsWithImages;
}

/**
 * Generates fallback concepts when AI generation fails
 * @param {object} musicalDNA - Musical DNA profile
 * @returns {Array} Fallback band concepts
 */
function generateFallbackConcepts(musicalDNA) {
  const primaryGenre = musicalDNA.primaryGenres[0]?.genre || 'indie rock';
  const energy = musicalDNA.audioProfile.energy || 0.5;
  const valence = musicalDNA.audioProfile.valence || 0.5;
  
  const energyType = energy > 0.7 ? 'high-energy' : energy > 0.4 ? 'moderate' : 'mellow';
  const moodType = valence > 0.6 ? 'upbeat' : valence > 0.4 ? 'balanced' : 'melancholic';
  
  return [
    {
      name: "The Midnight Algorithm",
      genre: `${primaryGenre} meets electronic experimentation`,
      description: "A fusion that takes familiar sounds and adds unexpected digital textures. They create music that feels both nostalgic and futuristic.",
      vibe: "Familiar yet alien, comfortable yet adventurous",
      inspiration: `What if your favorite ${primaryGenre} artist discovered modular synthesizers`,
      uniqueElement: "AI-influenced composition with human emotion",
      albumTitle: "Digital Echoes",
      albumConcept: "Exploring the intersection of human emotion and digital existence",
      songTitles: ["Binary Dreams", "Analog Heart", "Midnight Download"],
      albumCoverPrompt: "Neon-lit cityscape at midnight with geometric patterns overlaying organic musical instruments, cyberpunk aesthetic with warm analog glow, purple and orange color scheme",
      bandPhotoPrompt: "Four-piece band in a dimly lit studio filled with vintage synthesizers and modern guitars, moody lighting with purple and blue neon accents, dressed in a mix of vintage and futuristic clothing",
      images: { albumCover: null, bandPhoto: null }
    },
    {
      name: "Velvet Static",
      genre: `atmospheric ${primaryGenre} with shoegaze elements`,
      description: "Dreamy textures meet driving rhythms in an unexpected combination. They craft sonic landscapes that feel both intimate and expansive.",
      vibe: "Ethereal energy wrapped in velvet noise",
      inspiration: "What if Radiohead had a jam session with My Bloody Valentine",
      uniqueElement: "Layered ambient soundscapes over familiar song structures",
      albumTitle: "Frequency Dreams",
      albumConcept: "Songs about connection and disconnection in the modern age",
      songTitles: ["Static Romance", "Velvet Waves", "Frequency Lost"],
      albumCoverPrompt: "Abstract waves of color bleeding into static patterns, vintage film grain texture with deep purples and golds, dreamlike double exposure effect",
      bandPhotoPrompt: "Three musicians in soft focus with dreamy backlighting, guitars creating silhouettes against warm ambient background, vintage clothing with modern accessories",
      images: { albumCover: null, bandPhoto: null }
    },
    {
      name: "Chrome Hearts Club",
      genre: `${energyType} ${primaryGenre} with industrial undertones`,
      description: "Takes the emotional core of familiar music and gives it a harder edge. Mechanical precision meets raw human emotion.",
      vibe: `${moodType} intensity meets machine precision`,
      inspiration: "What if Nine Inch Nails produced your comfort playlist",
      uniqueElement: "Organic melodies with industrial rhythm sections",
      albumTitle: "Analog Resistance",
      albumConcept: "Fighting for humanity in a digital world",
      songTitles: ["Chrome Heart", "Resistance Frequency", "Human.exe"],
      albumCoverPrompt: "Metallic heart-shaped object against industrial machinery background, high contrast black and white with selective red accents, brutalist architecture elements",
      bandPhotoPrompt: "Band in an abandoned factory setting with dramatic shadows, mix of leather and metal aesthetic, industrial equipment as backdrop",
      images: { albumCover: null, bandPhoto: null }
    },
    {
      name: "Sunset Synthesis",
      genre: `${moodType} synthwave-influenced ${primaryGenre}`,
      description: "Nostalgic sounds reimagined through a modern lens. They create music that feels like memories you haven't made yet.",
      vibe: "Golden hour emotions in sonic form",
      inspiration: "What if The 1975 time-traveled to 1985 Miami",
      uniqueElement: "Retro-futuristic production with contemporary songwriting",
      albumTitle: "Tomorrow's Nostalgia",
      albumConcept: "Songs about future memories and past dreams",
      songTitles: ["Neon Sunset", "Tomorrow's Yesterday", "Synthetic Memories"],
      albumCoverPrompt: "Retro sunset gradient with palm tree silhouettes, 80s geometric patterns, vaporwave color palette with pink, purple, and orange",
      bandPhotoPrompt: "Band on a rooftop at sunset, 80s-inspired fashion with modern twist, city skyline in background with neon lights beginning to glow",
      images: { albumCover: null, bandPhoto: null }
    },
    {
      name: "The Wilderness Electric",
      genre: `folk-influenced ${primaryGenre} with electronic flourishes`,
      description: "Organic storytelling meets synthetic soundscapes. They prove that acoustic and electronic aren't opposites but dance partners.",
      vibe: "Campfire songs for the digital age",
      inspiration: "What if Bon Iver collaborated with Boards of Canada",
      uniqueElement: "Acoustic instruments processed through vintage synthesizers",
      albumTitle: "Electric Woods",
      albumConcept: "Finding nature in the digital wilderness",
      songTitles: ["Digital Campfire", "Synthetic Trees", "Electric River"],
      albumCoverPrompt: "Forest scene with glowing electronic elements integrated into nature, bioluminescent effects, mix of organic and digital textures",
      bandPhotoPrompt: "Band in a forest clearing with electronic equipment set up among the trees, golden hour lighting, blend of outdoor and electronic music gear",
      images: { albumCover: null, bandPhoto: null }
    }
  ];
}