# 🎶 Generate Audio V2 Function

AI-powered audio generation using Mureka API with lyrics and band context. Supports both direct POST requests and database event triggers.

## 🧰 Usage

### GET /

Interactive HTML test interface for testing the function with real-time status updates.

```
https://your-function-url.appwrite.global/
```

### POST /

Generate audio for a song that has lyrics. The function uses Mureka API to create professional-quality audio tracks.

**Parameters**

| Name               | Description                          | Location | Type               | Sample Value                |
| ------------------ | ------------------------------------ | -------- | ------------------ | --------------------------- |
| Content-Type       | The content type of the request body | Header   | `application/json` | N/A                         |
| songId             | ID of the song document              | Body     | String             | `68a8a566000c37b8e715`      |
| waitForCompletion  | Wait for audio generation (max 30s)  | Body     | Boolean            | `false`                     |

**Request Body**

```json
{
  "songId": "68a8a566000c37b8e715",
  "waitForCompletion": false
}
```

**Response (Immediate)**

Sample `200` Response when not waiting:

```json
{
  "success": true,
  "songId": "68a8a566000c37b8e715",
  "message": "Audio generation started",
  "taskId": "mureka-task-123456",
  "status": "processing"
}
```

**Response (With Completion)**

Sample `200` Response when `waitForCompletion: true`:

```json
{
  "success": true,
  "songId": "68a8a566000c37b8e715",
  "message": "Audio generated successfully",
  "audioUrl": "https://cdn.mureka.ai/audio/generated-track.mp3",
  "duration": 180
}
```

Sample `400` Response:

```json
{
  "success": false,
  "error": "Song must have title and lyrics before generating audio"
}
```

Sample `500` Response:

```json
{
  "success": false,
  "error": "Failed to generate audio: API error"
}
```

## 🎯 Database Event Trigger

This function can also be triggered automatically when a song document is updated with `status: "generating_audio"`.

### Automatic Trigger Flow:
1. Song document is updated with `status: "generating_audio"`
2. Function is triggered automatically via database event
3. Audio generation starts with Mureka API
4. Task ID is stored in song document
5. Use `check-audio-status-v2` to monitor progress
6. Song is updated when audio is complete

## 📊 Database Schema

### Songs Collection

**Fields Updated:**

| Field                    | Type   | Description                          | Sample Value                     |
| ------------------------ | ------ | ------------------------------------ | -------------------------------- |
| audioUrl                 | String | URL of generated audio file         | `https://cdn.mureka.ai/...mp3`  |
| audioDuration            | Number | Audio duration in seconds            | `180`                            |
| audioGenerationTaskId    | String | Mureka task ID for tracking         | `mureka-task-123456`             |
| status                   | String | Current generation status            | `audio_complete`                 |
| audioGenerationStartedAt | String | ISO timestamp when generation started | `2024-01-15T10:30:00Z`          |
| audioGenerationCompletedAt | String | ISO timestamp when completed       | `2024-01-15T10:33:00Z`          |
| generationError          | String | Error message if generation fails   | `API timeout`                    |

**Status Enum Values:**
- `pending` - Initial state
- `generating_audio` - Starting audio generation
- `audio_processing` - Audio is being generated
- `audio_complete` - Audio successfully generated
- `audio_failed` - Generation failed

### Bands Collection (Read for Context)

**Fields Used:**

| Field         | Type   | Description                        | Sample Value          |
| ------------- | ------ | ---------------------------------- | --------------------- |
| profileData   | String | JSON string of complete band profile | `{"bandName":"..."}`  |
| primaryGenre  | String | Primary music genre                | `Alternative Rock`    |
| coreSound     | String | Core sound description             | `Dynamic and energetic` |

## 🎵 Mureka API Integration

### Generation Parameters

The function sends these parameters to Mureka:

```json
{
  "title": "Song Title",
  "lyrics": "Complete lyrics with sections",
  "description": "Alternative Rock song with dynamic energy",
  "artist_description": "Alternative Rock band",
  "genre": "Alternative Rock",
  "style": "Dynamic and energetic",
  "model": "mureka-v2",
  "quality": "high"
}
```

### Model Configuration

- **Model**: `mureka-v2` - Latest Mureka model
- **Quality**: `high` - Professional quality output
- **Format**: MP3 audio file
- **Duration**: Typically 2-4 minutes based on lyrics

## 🔧 Configuration

| Setting           | Value         |
| ----------------- | ------------- |
| Runtime           | Node (18.0)   |
| Entrypoint        | `src/main.js` |
| Build Commands    | `npm install` |
| Permissions       | `any`         |
| Timeout (Seconds) | 60            |

## 🔒 Environment Variables

### MUREKA_API_KEY

Your Mureka API key for audio generation. This is a paid service.

| Question     | Answer                                                |
| ------------ | ----------------------------------------------------- |
| Required     | Yes                                                   |
| Sample Value | `mk_live_...`                                        |
| Documentation | [Mureka API Docs](https://docs.mureka.ai)            |

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

### JavaScript (Frontend with Polling)

```javascript
// Start audio generation
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    songId: 'your-song-id',
    waitForCompletion: false
  })
});

const result = await response.json();
const taskId = result.taskId;

// Poll for status
const checkStatus = async () => {
  const statusResponse = await fetch('https://check-audio-status-v2.appwrite.global/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      taskId: taskId,
      songId: 'your-song-id'
    })
  });
  
  const status = await statusResponse.json();
  
  if (status.status === 'completed') {
    console.log('Audio ready:', status.audioUrl);
  } else if (status.status === 'failed') {
    console.error('Generation failed:', status.error);
  } else {
    // Check again in 5 seconds
    setTimeout(checkStatus, 5000);
  }
};

setTimeout(checkStatus, 5000);
```

### JavaScript (Wait for Completion)

```javascript
// Wait for audio to be generated (max 30 seconds)
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    songId: 'your-song-id',
    waitForCompletion: true
  })
});

const result = await response.json();
if (result.audioUrl) {
  console.log('Audio ready:', result.audioUrl);
  // Play audio
  const audio = new Audio(result.audioUrl);
  audio.play();
}
```

### cURL

```bash
# Start generation
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "songId": "68a8a566000c37b8e715",
    "waitForCompletion": false
  }'

# Check status (separate request)
curl -X POST https://check-audio-status-v2.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "mureka-task-123456",
    "songId": "68a8a566000c37b8e715"
  }'
```

### Database Trigger (Automatic)

```javascript
// Update song to trigger audio generation
await databases.updateDocument(
  'mitchly-music-db',
  'songs',
  songId,
  { status: 'generating_audio' }
);
// Function will be triggered automatically
```

## 🎯 Generation Workflow

### Standard Flow:
1. **Check Prerequisites**: Song must have title and lyrics
2. **Fetch Band Context**: Get genre and style from band profile
3. **Start Generation**: Send to Mureka API with parameters
4. **Store Task ID**: Save in song document for tracking
5. **Return Response**: Immediate response with task ID
6. **Monitor Progress**: Use check-audio-status-v2 function

### With Wait Option:
1. Steps 1-4 same as above
2. **Poll Status**: Check every 5 seconds up to 30 seconds
3. **Return Result**: Audio URL if complete, or timeout with task ID

## 🚨 Error Handling

The function includes comprehensive error handling:

1. **Missing Prerequisites**: Returns 400 if no title or lyrics
2. **Already Has Audio**: Skips generation, returns existing URL
3. **API Failures**: Updates song status to `audio_failed` with error
4. **Band Context Missing**: Uses default genre "Alternative Rock"
5. **Timeout Handling**: Returns task ID after 30 seconds if not complete

## 📊 Dual Trigger Support

This function supports two trigger methods:

### 1. Direct POST Request
- Immediate execution
- Optional wait for completion
- Returns task ID or audio URL
- Used for on-demand generation

### 2. Database Event Trigger
- Automatic execution when `status: "generating_audio"`
- No wait option (always async)
- Updates song with task ID
- Used for workflow automation

## 🎵 Audio Quality Settings

### Default Parameters:
- **Bitrate**: 320 kbps (high quality)
- **Format**: MP3 (universal compatibility)
- **Sample Rate**: 44.1 kHz (CD quality)
- **Channels**: Stereo

### Genre-Specific Optimization:
The function automatically adjusts parameters based on genre:
- **Rock/Metal**: Enhanced guitars and drums
- **Electronic**: Optimized synth and bass
- **Acoustic**: Natural instrument clarity
- **Hip-Hop**: Strong beat and bass presence

## 🎯 Best Practices

1. **Prerequisites**: Ensure song has lyrics before calling
2. **Polling Strategy**: Check status every 5-10 seconds
3. **Error Recovery**: Check `generationError` field on failure
4. **Batch Processing**: Use database triggers for multiple songs
5. **Testing**: Use HTML interface for testing with audio playback
6. **Cost Management**: Monitor Mureka API usage and costs

## 📚 Related Functions

- `generate-lyrics-v2`: Generates lyrics before audio
- `check-audio-status-v2`: Monitors audio generation progress
- `generate-band-v2`: Creates bands and initial songs