const sdk = require('node-appwrite');
const OpenAI = require('openai');

module.exports = async ({ req, res, log, error }) => {
  try {
    const { guestId, favoriteArtists, genres, description, count = 3 } = JSON.parse(req.bodyRaw || '{}');
    
    if (!guestId || !favoriteArtists || !genres) {
      return res.json({
        success: false,
        error: 'Missing required parameters'
      }, 400);
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create prompt for band generation
    const prompt = `Based on the following music preferences, create ${count} unique fictional bands:

Favorite Artists: ${favoriteArtists.join(', ')}
Favorite Genres: ${genres.join(', ')}
Music Description: ${description || 'Not provided'}

For each band, create:
1. A unique band name that feels authentic
2. Primary genre (can be a fusion)
3. Origin city/country
4. Formation year (between 2015-2024)
5. A compelling 2-3 sentence description
6. Musical style influences
7. What makes them unique

Return as JSON array with this structure:
[{
  "bandName": "...",
  "primaryGenre": "...",
  "origin": "...",
  "formationYear": 2020,
  "description": "...",
  "influences": ["..."],
  "uniqueAspect": "..."
}]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative music expert who creates realistic fictional bands based on user preferences. Make bands that would appeal to fans of the given artists and genres."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2000
    });

    const bandsData = JSON.parse(completion.choices[0].message.content);

    // Initialize Appwrite SDK
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    client
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    // Create band documents
    const createdBands = [];
    
    for (const band of bandsData) {
      try {
        const bandDoc = await databases.createDocument(
          'main',
          'bands',
          sdk.ID.unique(),
          {
            userId: `guest_${guestId}`,
            bandName: band.bandName,
            status: 'published',
            primaryGenre: band.primaryGenre,
            profileData: JSON.stringify({
              ...band,
              isGuest: true
            }),
            origin: band.origin,
            formationYear: band.formationYear,
            createdBy: 'guest',
            userPrompt: `Artists: ${favoriteArtists.join(', ')}, Genres: ${genres.join(', ')}`
          }
        );
        
        createdBands.push({
          id: bandDoc.$id,
          ...band
        });
      } catch (err) {
        error('Error creating band document:', err);
      }
    }

    log(`Generated ${createdBands.length} bands for guest ${guestId}`);

    return res.json({
      success: true,
      bands: createdBands
    });

  } catch (err) {
    error('Error generating guest bands:', err);
    return res.json({
      success: false,
      error: 'Failed to generate bands'
    }, 500);
  }
};
