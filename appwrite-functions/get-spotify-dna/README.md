# 🎵 Get Spotify DNA Function

Analyzes a user's Spotify listening history to create a personalized musical DNA profile and generates AI-powered band concepts that would become their new favorite bands.

## 🧰 Usage

### GET /

Interactive HTML test interface for analyzing Spotify listening data with a beautiful UI.

```
https://your-function-url.appwrite.global/
```

### POST /

Analyze Spotify listening history and generate personalized band concepts.

**Parameters**

| Name         | Description                          | Location | Type               | Sample Value                |
| ------------ | ------------------------------------ | -------- | ------------------ | --------------------------- |
| Content-Type | The content type of the request body | Header   | `application/json` | N/A                         |
| spotifyToken | Spotify access token                 | Body     | String             | `BQA8...` (OAuth token)     |
| userId       | Appwrite user ID (alternative)       | Body     | String             | `642...7cd`                 |
| forceUpdate  | Bypass 24-hour cache                | Body     | Boolean            | `false`                     |

**Request Body**

```json
{
  "spotifyToken": "BQA8...", // Spotify OAuth access token
  // OR
  "userId": "642...7cd",     // Appwrite user ID with stored token
  "forceUpdate": false        // Optional: force refresh data
}
```

**Response**

Sample `200` Response:

```json
{
  "success": true,
  "musicalDNA": {
    "primaryGenres": [
      { "genre": "indie rock", "weight": 45, "percentage": 23.5 },
      { "genre": "alternative", "weight": 38, "percentage": 19.8 }
    ],
    "audioProfile": {
      "energy": 0.68,
      "valence": 0.52,
      "danceability": 0.61,
      "acousticness": 0.28,
      "tempo": 128
    },
    "artistInfluences": [
      { "name": "Arctic Monkeys", "genres": ["indie rock"], "popularity": 84 }
    ],
    "aiSummary": {
      "primaryGenres": ["indie rock", "alternative"],
      "energyProfile": "moderate-energy",
      "emotionalTone": "balanced emotional range",
      "tempoPreference": "moderate tempo"
    }
  },
  "bandConcepts": [
    {
      "name": "Velvet Static",
      "genre": "atmospheric indie rock with shoegaze elements",
      "description": "Dreamy textures meet driving rhythms...",
      "vibe": "Ethereal energy wrapped in velvet noise",
      "uniqueElement": "Layered ambient soundscapes",
      "albumTitle": "Frequency Dreams",
      "images": {
        "albumCover": { "url": "https://..." },
        "bandPhoto": { "url": "https://..." }
      }
    }
  ],
  "profile": {
    "displayName": "John Doe",
    "email": "john@example.com",
    "country": "US",
    "product": "premium"
  },
  "message": "Spotify DNA analysis completed successfully"
}
```

Sample `400` Response:

```json
{
  "success": false,
  "error": "Either userId or spotifyToken is required"
}
```

Sample `500` Response:

```json
{
  "success": false,
  "error": "Failed to fetch Spotify data: Invalid access token"
}
```

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                  |
| Build Commands    | `npm install`                  |
| Permissions       | `any`                          |
| Timeout (Seconds) | 60                             |
| Events            | Optional: `users.*.create`     |

## 🔒 Environment Variables

### ANTHROPIC_API_KEY

Your Anthropic API key for Claude AI band concept generation.

| Question      | Answer                                                                |
| ------------- | --------------------------------------------------------------------- |
| Required      | Yes                                                                   |
| Sample Value  | `sk-ant-api03-...`                                                   |
| Documentation | [Anthropic API Docs](https://docs.anthropic.com/claude/reference/getting-started) |

### FAL_API_KEY

Your FAL.ai API key for AI image generation (album covers and band photos).

| Question     | Answer                                  |
| ------------ | --------------------------------------- |
| Required     | No                                      |
| Sample Value | `fal-...`                               |
| Documentation | [FAL.ai Docs](https://fal.ai/docs)     |

### SPOTIFY_CLIENT_ID

Spotify application client ID (if implementing OAuth flow).

| Question     | Answer                                                    |
| ------------ | --------------------------------------------------------- |
| Required     | No (if using pre-obtained tokens)                        |
| Sample Value | `a1b2c3d4e5f6...`                                         |
| Documentation | [Spotify App Settings](https://developer.spotify.com/dashboard) |

### SPOTIFY_CLIENT_SECRET

Spotify application client secret (if implementing OAuth flow).

| Question     | Answer                                                    |
| ------------ | --------------------------------------------------------- |
| Required     | No (if using pre-obtained tokens)                        |
| Sample Value | `z9y8x7w6v5u4...`                                         |
| Documentation | [Spotify App Settings](https://developer.spotify.com/dashboard) |

### Auto-Injected Variables (Do not set manually)

- `APPWRITE_FUNCTION_API_ENDPOINT` - Appwrite API endpoint
- `APPWRITE_FUNCTION_PROJECT_ID` - Current project ID
- `APPWRITE_FUNCTION_ID` - This function's ID
- `APPWRITE_FUNCTION_API_KEY` - Function API key (when configured)

### Optional Database Configuration

- `APPWRITE_DATABASE_ID` - Database ID (default: `mitchly-music-db`)
- `USER_PROFILES_COLLECTION` - User profiles collection (default: `user_music_profiles`)
- `BAND_CONCEPTS_COLLECTION` - Band concepts collection (default: `band_concepts`)

## 📊 Database Schema

### User Music Profiles Collection

| Field          | Type    | Required | Description                      | Sample Value                |
| -------------- | ------- | -------- | -------------------------------- | --------------------------- |
| userId         | String  | Yes      | Appwrite user ID                 | `642...7cd`                 |
| spotifyProfile | Object  | No       | Spotify user profile data        | `{display_name: "John"}`    |
| topTracks      | Object  | No       | Top tracks by time period        | `{short: [], medium: []}`   |
| topArtists     | Array   | No       | Top artists                      | `[{name: "Artist"}]`        |
| audioFeatures  | Array   | No       | Audio features of tracks         | `[{energy: 0.8}]`           |
| musicalDNA     | Object  | Yes      | Generated musical DNA profile    | `{primaryGenres: []}`       |
| bandConcepts   | Array   | No       | Top 5 generated band concepts    | `[{name: "Band"}]`          |
| lastUpdated    | String  | Yes      | ISO timestamp of last update     | `2024-01-20T10:30:00Z`      |
| onboardingComplete | Boolean | Yes   | Whether onboarding is done       | `true`                      |

### Band Concepts Collection

| Field       | Type    | Required | Description                   | Sample Value                |
| ----------- | ------- | -------- | ----------------------------- | --------------------------- |
| userId      | String  | Yes      | User who owns concepts        | `642...7cd`                 |
| concepts    | Array   | Yes      | Array of band concepts        | `[{name: "Band"}]`          |
| musicalDNA  | Object  | No       | AI summary of musical profile | `{genres: []}`              |
| type        | String  | Yes      | Concept type                  | `spotify_dna`               |
| createdAt   | String  | Yes      | ISO timestamp                 | `2024-01-20T10:30:00Z`      |

## 💻 Integration Examples

### JavaScript (Frontend)

```javascript
// Using fetch with Spotify token
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    spotifyToken: 'BQA8...', // Get from Spotify OAuth
    forceUpdate: false
  })
});

const result = await response.json();
if (result.success) {
  console.log('Musical DNA:', result.musicalDNA);
  console.log('Band Concepts:', result.bandConcepts);
}

// Using Appwrite SDK with stored user
const execution = await functions.createExecution(
  'get-spotify-dna',
  JSON.stringify({ 
    userId: 'current-user-id',
    forceUpdate: false 
  }),
  false
);
```

### cURL

```bash
# With Spotify token
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "spotifyToken": "BQA8...",
    "forceUpdate": false
  }'

# With user ID
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "642...7cd",
    "forceUpdate": true
  }'
```

## 🚨 Error Handling

The function includes comprehensive error handling:

1. **Missing Credentials**: Returns 400 if neither spotifyToken nor userId provided
2. **Invalid Token**: Returns 502 with Spotify API error details
3. **No Spotify Data**: Returns 400 if user has no stored Spotify credentials
4. **API Failures**: Returns appropriate status codes with error messages
5. **Cache Logic**: Uses 24-hour cache unless forceUpdate is true

## 📝 Development

### Local Testing

1. Install dependencies:
```bash
cd appwrite-functions/get-spotify-dna
npm install
```

2. Set environment variables:
```bash
export ANTHROPIC_API_KEY=your-key
export FAL_API_KEY=your-key # optional
export APPWRITE_FUNCTION_API_KEY=your-key
```

3. Get a Spotify access token:
   - Visit [Spotify Console](https://developer.spotify.com/console/get-current-user/)
   - Click "Get Token" and select required scopes:
     - `user-top-read`
     - `user-read-recently-played`
     - `user-read-private`
     - `user-read-email`

4. Deploy to Appwrite:
```bash
../deploy-function.sh get-spotify-dna
```

## 🎯 Spotify Scopes Required

When implementing OAuth flow, request these scopes:
- `user-top-read` - Read top artists and tracks
- `user-read-recently-played` - Read recently played tracks
- `user-read-private` - Read user profile
- `user-read-email` - Read user email

## 📚 Related Functions

- `generate-band-v2` - Creates full band profiles from concepts
- `generate-lyrics-v2` - Generates lyrics for songs
- `generate-audio-v2` - Creates audio from lyrics
- `check-audio-status-v2` - Monitors audio generation

## 🎨 Musical DNA Components

The function analyzes:

### 1. Genre Profile
- Primary genres with weights
- Genre exploration patterns
- Temporal genre evolution

### 2. Audio Features
- Energy levels (0-1)
- Valence (happiness) (0-1)
- Danceability (0-1)
- Acousticness (0-1)
- Instrumentalness (0-1)
- Tempo (BPM)

### 3. Listening Behavior
- **Explorer**: Constantly discovering new music
- **Loyalist**: Deep diving into favorite artists
- **Balanced**: Mix of discovery and loyalty

### 4. Musical Quirks
- Genre exploration patterns
- Energy preferences
- Mood consistency
- Instrumental preferences
- Acoustic preferences

## 🤖 Band Concept Generation

Each generated band concept includes:
- Unique band name
- Genre blend description
- 2-3 sentence sound description
- Overall vibe/atmosphere
- What makes them unique
- Debut album title and concept
- Sample song titles
- AI-generated album cover (if FAL key provided)
- AI-generated band photo (if FAL key provided)

## 🔄 Caching Strategy

- Profiles are cached for 24 hours to reduce API calls
- Use `forceUpdate: true` to bypass cache
- Cache check based on `lastUpdated` timestamp
- Automatic cache invalidation after 24 hours

## 🎯 Best Practices

1. **Token Management**: Store Spotify refresh tokens securely
2. **Rate Limiting**: Implement rate limiting for production
3. **Error Recovery**: Handle expired tokens gracefully
4. **Image Generation**: FAL API key is optional but enhances experience
5. **Database Indexes**: Create indexes on userId for performance