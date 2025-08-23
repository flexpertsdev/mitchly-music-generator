# 🔍 Check Audio Status V2 Function

Monitor audio generation progress and automatically update songs when complete. Works with Mureka API task tracking.

## 🧰 Usage

### GET /

Interactive HTML test interface for checking audio generation status with real-time updates.

```
https://your-function-url.appwrite.global/
```

### POST /

Check the status of an audio generation task and optionally update the associated song document.

**Parameters**

| Name         | Description                          | Location | Type               | Sample Value                |
| ------------ | ------------------------------------ | -------- | ------------------ | --------------------------- |
| Content-Type | The content type of the request body | Header   | `application/json` | N/A                         |
| taskId       | Mureka task ID to check              | Body     | String             | `mureka-task-123456`        |
| songId       | Optional: Song ID to auto-update     | Body     | String             | `68a8a566000c37b8e715`      |

**Request Body**

```json
{
  "taskId": "mureka-task-123456",
  "songId": "68a8a566000c37b8e715"
}
```

**Response**

Sample `200` Response (Processing):

```json
{
  "success": true,
  "taskId": "mureka-task-123456",
  "status": "processing",
  "progress": 65,
  "audioUrl": null,
  "duration": null,
  "error": null
}
```

Sample `200` Response (Completed):

```json
{
  "success": true,
  "taskId": "mureka-task-123456",
  "status": "completed",
  "progress": 100,
  "audioUrl": "https://cdn.mureka.ai/audio/generated-track.mp3",
  "duration": 180,
  "error": null
}
```

Sample `200` Response (Failed):

```json
{
  "success": true,
  "taskId": "mureka-task-123456",
  "status": "failed",
  "progress": 0,
  "audioUrl": null,
  "duration": null,
  "error": "Generation failed: Insufficient credits"
}
```

Sample `400` Response:

```json
{
  "success": false,
  "error": "Missing required field: taskId"
}
```

Sample `500` Response:

```json
{
  "success": false,
  "error": "Failed to check audio status: API error"
}
```

## 📊 Status Values

### Mureka Task Status

| Status      | Description                          | Progress | Next Action                |
| ----------- | ------------------------------------ | -------- | -------------------------- |
| `pending`   | Task is queued                       | 0%       | Wait and check again       |
| `processing`| Audio is being generated             | 1-99%    | Continue checking          |
| `completed` | Audio generation successful          | 100%     | Download/use audio URL     |
| `failed`    | Generation failed                    | 0%       | Check error message        |

## 📊 Database Schema

### Songs Collection (Auto-Updated)

When a `songId` is provided and the task is complete, these fields are automatically updated:

**On Success (status: completed):**

| Field                      | Type   | Description                        | Sample Value                    |
| -------------------------- | ------ | ---------------------------------- | ------------------------------- |
| audioUrl                   | String | URL of generated audio file       | `https://cdn.mureka.ai/...mp3` |
| audioDuration              | Number | Audio duration in seconds          | `180`                           |
| status                     | String | Updated to `audio_complete`       | `audio_complete`                |
| audioGenerationCompletedAt | String | ISO timestamp when completed      | `2024-01-15T10:33:00Z`          |

**On Failure (status: failed):**

| Field            | Type   | Description                     | Sample Value                     |
| ---------------- | ------ | ------------------------------- | -------------------------------- |
| status           | String | Updated to `audio_failed`       | `audio_failed`                   |
| generationError  | String | Error message from Mureka       | `Generation failed: API timeout` |

## 🔧 Configuration

| Setting           | Value         |
| ----------------- | ------------- |
| Runtime           | Node (18.0)   |
| Entrypoint        | `src/main.js` |
| Build Commands    | `npm install` |
| Permissions       | `any`         |
| Timeout (Seconds) | 15            |

## 🔒 Environment Variables

### MUREKA_API_KEY

Your Mureka API key for checking generation status.

| Question     | Answer                                    |
| ------------ | ----------------------------------------- |
| Required     | Yes                                       |
| Sample Value | `mk_live_...`                             |
| Documentation | [Mureka API Docs](https://docs.mureka.ai) |

### APPWRITE_FUNCTION_API_KEY

API key for accessing Appwrite database. Required if songId is provided and not passed via headers.

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

### JavaScript (Polling Implementation)

```javascript
class AudioStatusChecker {
  constructor(functionUrl) {
    this.functionUrl = functionUrl;
    this.pollInterval = 5000; // 5 seconds
    this.maxAttempts = 60; // 5 minutes total
  }
  
  async checkStatus(taskId, songId) {
    const response = await fetch(this.functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId, songId })
    });
    
    return await response.json();
  }
  
  async pollUntilComplete(taskId, songId) {
    let attempts = 0;
    
    while (attempts < this.maxAttempts) {
      const status = await this.checkStatus(taskId, songId);
      
      if (status.status === 'completed') {
        return {
          success: true,
          audioUrl: status.audioUrl,
          duration: status.duration
        };
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Audio generation failed');
      }
      
      console.log(`Progress: ${status.progress}%`);
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
    
    throw new Error('Timeout: Audio generation took too long');
  }
}

// Usage
const checker = new AudioStatusChecker('https://your-function-url.appwrite.global/');

try {
  const result = await checker.pollUntilComplete('mureka-task-123456', 'song-id');
  console.log('Audio ready:', result.audioUrl);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useAudioStatus(taskId, songId) {
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!taskId) return;
    
    const checkStatus = async () => {
      try {
        const response = await fetch('https://your-function-url.appwrite.global/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, songId })
        });
        
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.status === 'completed') {
          setAudioUrl(data.audioUrl);
        } else if (data.status === 'failed') {
          setError(data.error);
        }
        
        return data.status;
      } catch (err) {
        setError(err.message);
        return 'failed';
      }
    };
    
    const interval = setInterval(async () => {
      const currentStatus = await checkStatus();
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        clearInterval(interval);
      }
    }, 5000);
    
    // Initial check
    checkStatus();
    
    return () => clearInterval(interval);
  }, [taskId, songId]);
  
  return { status, progress, audioUrl, error };
}

// Usage in component
function AudioPlayer({ taskId, songId }) {
  const { status, progress, audioUrl, error } = useAudioStatus(taskId, songId);
  
  if (error) return <div>Error: {error}</div>;
  if (status === 'processing') return <div>Generating... {progress}%</div>;
  if (status === 'completed' && audioUrl) {
    return <audio src={audioUrl} controls />;
  }
  return <div>Waiting...</div>;
}
```

### cURL

```bash
# Check status only
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "mureka-task-123456"
  }'

# Check status and auto-update song
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "mureka-task-123456",
    "songId": "68a8a566000c37b8e715"
  }'
```

### Bash Polling Script

```bash
#!/bin/bash

TASK_ID="mureka-task-123456"
SONG_ID="68a8a566000c37b8e715"
FUNCTION_URL="https://your-function-url.appwrite.global/"
MAX_ATTEMPTS=60
SLEEP_TIME=5

for i in $(seq 1 $MAX_ATTEMPTS); do
  RESPONSE=$(curl -s -X POST $FUNCTION_URL \
    -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\",\"songId\":\"$SONG_ID\"}")
  
  STATUS=$(echo $RESPONSE | jq -r '.status')
  PROGRESS=$(echo $RESPONSE | jq -r '.progress')
  
  echo "Attempt $i: Status=$STATUS, Progress=$PROGRESS%"
  
  if [ "$STATUS" = "completed" ]; then
    AUDIO_URL=$(echo $RESPONSE | jq -r '.audioUrl')
    echo "Success! Audio URL: $AUDIO_URL"
    exit 0
  fi
  
  if [ "$STATUS" = "failed" ]; then
    ERROR=$(echo $RESPONSE | jq -r '.error')
    echo "Failed: $ERROR"
    exit 1
  fi
  
  sleep $SLEEP_TIME
done

echo "Timeout: Generation took too long"
exit 1
```

## 🎯 Polling Strategy

### Recommended Intervals

| Progress Range | Recommended Interval | Reason                           |
| -------------- | -------------------- | -------------------------------- |
| 0-20%          | 10 seconds           | Initial processing               |
| 21-80%         | 5 seconds            | Active generation                |
| 81-99%         | 3 seconds            | Nearly complete                  |
| Failed/Complete| Stop polling         | Final state reached              |

### Timeout Handling

- **Default timeout**: 5 minutes (60 attempts × 5 seconds)
- **Extended timeout**: 10 minutes for long songs
- **Retry strategy**: After failure, wait 30 seconds before retry

## 🚨 Error Handling

### Common Error Scenarios

1. **Task Not Found**: Returns `pending` status with error message
2. **API Connection Failed**: Returns 500 with connection error
3. **Invalid Task ID**: Returns proper error message
4. **Database Update Failed**: Logs error but returns status successfully

### Error Recovery

```javascript
// Retry logic for transient failures
async function checkWithRetry(taskId, songId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, songId })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

## 📊 Mureka API Response Mapping

### Status Normalization

The function normalizes various Mureka response formats:

```javascript
// Mureka Response → Function Response
{
  status: data.status || 'processing',
  progress: data.progress || 0,
  audioUrl: data.audio_url || data.result?.audio_url || null,
  duration: data.duration || data.result?.duration || null,
  error: data.error || null
}
```

## 🎯 Best Practices

1. **Polling Frequency**: Start with 5-second intervals
2. **Timeout Handling**: Set maximum attempts (e.g., 60 for 5 minutes)
3. **Error Recovery**: Implement retry logic for network failures
4. **Progress Display**: Show progress percentage to users
5. **Song Updates**: Always provide songId for automatic updates
6. **Resource Cleanup**: Clear intervals/timeouts when component unmounts

## 📚 Related Functions

- `generate-audio-v2`: Initiates audio generation and returns task ID
- `generate-lyrics-v2`: Generates lyrics before audio
- `generate-band-v2`: Creates bands and initial songs