# 🎵 Generate Lyrics V2 Function

AI-powered lyrics generation for songs with band context awareness. Supports both direct POST requests and database event triggers.

## 🧰 Usage

### GET /

Interactive HTML test interface for testing the function with a beautiful UI.

```
https://your-function-url.appwrite.global/
```

### POST /

Generate lyrics for a song by providing its ID. The function fetches song details and band context to create contextually appropriate lyrics.

**Parameters**

| Name         | Description                          | Location | Type               | Sample Value                |
| ------------ | ------------------------------------ | -------- | ------------------ | --------------------------- |
| Content-Type | The content type of the request body | Header   | `application/json` | N/A                         |
| songId       | ID of the song document              | Body     | String             | `68a8a566000c37b8e715`      |

**Request Body**

```json
{
  "songId": "68a8a566000c37b8e715"
}
```

**Response**

Sample `200` Response:

```json
{
  "success": true,
  "songId": "68a8a566000c37b8e715",
  "message": "Lyrics generated successfully",
  "preview": "First 100 characters of lyrics..."
}
```

Sample `400` Response:

```json
{
  "success": false,
  "error": "Missing required field: songId"
}
```

Sample `500` Response:

```json
{
  "success": false,
  "error": "Failed to generate lyrics: API error"
}
```

## 🎯 Database Event Trigger

This function can also be triggered automatically when a song document is created or updated with `status: "generating_lyrics"`.

### Automatic Trigger Flow:
1. Song document is created/updated with `status: "generating_lyrics"`
2. Function is triggered automatically via database event
3. Lyrics are generated based on song and band context
4. Song document is updated with:
   - `lyrics`: Full generated lyrics with sections
   - `songDescription`: Brief description for AI music platforms
   - `status`: Updated to `"lyrics_complete"` or `"lyrics_failed"`

## 📊 Database Schema

### Songs Collection

**Fields Updated:**

| Field            | Type   | Description                                          | Sample Value                     |
| ---------------- | ------ | ---------------------------------------------------- | -------------------------------- |
| lyrics           | String | Complete song lyrics with sections                  | `[Intro]\nMusic...\n\n[Verse 1]` |
| songDescription  | String | Brief description for AI music generation (<100 chars) | `Energetic rock anthem...`      |
| status           | String | Current generation status                           | `lyrics_complete`                |
| generationError  | String | Error message if generation fails                   | `API timeout`                    |

**Status Enum Values:**
- `pending` - Initial state
- `generating_lyrics` - Currently generating lyrics
- `lyrics_complete` - Lyrics successfully generated
- `lyrics_failed` - Generation failed

### Bands Collection (Read for Context)

**Fields Used:**

| Field         | Type   | Description                        | Sample Value          |
| ------------- | ------ | ---------------------------------- | --------------------- |
| profileData   | String | JSON string of complete band profile | `{"bandName":"..."}`  |
| bandName      | String | Band name                          | `Neon Dreamscape`     |
| primaryGenre  | String | Primary music genre                | `Alternative Rock`    |

## 🤖 AI System Prompt

The function uses a sophisticated system prompt that incorporates band context:

```
You are an expert songwriter creating lyrics for a {genre} band.

Band Context:
- Genre: {primaryGenre}
- Vocal Style: {vocalStyle}
- Core Sound: {coreSound}
- Influences: {influences}
- Lyrical Themes: {lyricalThemes}
- Album: "{albumTitle}" - {albumDescription}
- Band Instructions: {bandAiInstructions}

Create complete song lyrics with:
1. A brief song description (under 100 characters) for AI music platforms
2. Full lyrics with proper song structure

The song should:
- Match the band's established style and genre
- Include sections like [Intro], [Verse], [Chorus], [Bridge], [Outro]
- Be ready for AI music generation
- Feel authentic to the band's identity
```

## 🔧 Configuration

| Setting           | Value         |
| ----------------- | ------------- |
| Runtime           | Node (18.0)   |
| Entrypoint        | `src/main.js` |
| Build Commands    | `npm install` |
| Permissions       | `any`         |
| Timeout (Seconds) | 30            |

## 🔒 Environment Variables

### ANTHROPIC_API_KEY

Your Anthropic API key for Claude AI. Required for lyrics generation.

| Question     | Answer                                                                |
| ------------ | --------------------------------------------------------------------- |
| Required     | Yes                                                                   |
| Sample Value | `sk-ant-api03-...`                                                   |
| Documentation | [Anthropic API Docs](https://docs.anthropic.com/claude/reference/getting-started) |

### APPWRITE_FUNCTION_API_KEY

API key for accessing Appwrite database. Required if not passed via headers.

| Question     | Answer              |
| ------------ | ------------------- |
| Required     | No (uses header)    |
| Sample Value | `d03f...8a9`        |

### APPWRITE_FUNCTION_PROJECT_ID

Your Appwrite project ID.

| Question     | Answer              |
| ------------ | ------------------- |
| Required     | Yes (auto-injected) |
| Sample Value | `670f...123`        |

### APPWRITE_FUNCTION_API_ENDPOINT

Appwrite API endpoint.

| Question     | Answer                            |
| ------------ | --------------------------------- |
| Required     | No                                |
| Default      | `https://cloud.appwrite.io/v1`   |
| Sample Value | `https://cloud.appwrite.io/v1`   |

## 💻 Integration Examples

### JavaScript (Frontend)

```javascript
// Using fetch
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    songId: 'your-song-id'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Lyrics generated for song:', result.songId);
}

// Using Appwrite SDK
const execution = await functions.createExecution(
  'generate-lyrics-v2',
  JSON.stringify({ songId: 'your-song-id' }),
  false
);
```

### cURL

```bash
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "songId": "68a8a566000c37b8e715"
  }'
```

### Database Trigger (Automatic)

```javascript
// Update song to trigger lyrics generation
await databases.updateDocument(
  'mitchly-music-db',
  'songs',
  songId,
  { status: 'generating_lyrics' }
);
// Function will be triggered automatically
```

## 📝 Lyrics Format

Generated lyrics follow this structure:

```
[Intro]
Instrumental or intro lyrics

[Verse 1]
First verse lyrics
Multiple lines

[Chorus]
Chorus lyrics
Repeated throughout

[Verse 2]
Second verse lyrics

[Bridge]
Bridge section

[Outro]
Ending lyrics or instructions
```

## 🎨 Song Description Format

The `songDescription` field provides a brief description for AI music generation platforms:

- Maximum 100 characters
- Includes tempo, mood, and style hints
- Example: `"Energetic alternative rock anthem with driving guitars and powerful vocals"`

## 🚨 Error Handling

The function includes comprehensive error handling:

1. **Missing Song ID**: Returns 400 with error message
2. **Song Not Found**: Returns 500 with detailed error
3. **Missing Lyrics**: Checks if lyrics already exist to avoid regeneration
4. **API Failures**: Updates song status to `lyrics_failed` with error details
5. **Band Context Missing**: Continues with default genre/style values

## 📊 Dual Trigger Support

This function supports two trigger methods:

### 1. Direct POST Request
- Immediate execution
- Returns success/failure response
- Used for on-demand generation

### 2. Database Event Trigger
- Automatic execution when `status: "generating_lyrics"`
- No immediate response needed
- Used for workflow automation

The function automatically detects the trigger type:
- Direct calls have `songId` in body
- Database events have `$id` in body (the document ID)

## 🎯 Best Practices

1. **Check Status First**: Query song status before generating to avoid duplicates
2. **Band Context**: Ensure band has `profileData` for best results
3. **Error Recovery**: Check `generationError` field if status is `lyrics_failed`
4. **Batch Processing**: Use database triggers for multiple songs
5. **Testing**: Use the HTML interface at GET / for testing

## 📚 Related Functions

- `generate-band-v2`: Creates bands and initial songs
- `generate-audio-v2`: Generates audio from lyrics
- `check-audio-status-v2`: Monitors audio generation progress