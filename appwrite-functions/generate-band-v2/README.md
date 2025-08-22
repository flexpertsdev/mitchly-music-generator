# Generate Band V2 Function

An executable Appwrite function that generates complete fictional band profiles with AI. This is a POST-based executable function that can be called on-demand.

## Overview

This function accepts a creative prompt via POST request and generates:
- Complete band profile with backstory
- Album concept with 10-12 track listings
- Visual identity and branding
- AI-generated artwork (logo, album cover, band photo)

## Key Differences from V1

- **Executable Function**: Accepts POST requests directly (not event-triggered)
- **Schema-Compliant**: Uses the actual Appwrite database schema
- **Better Error Handling**: Updates band status on failure
- **Test Interface**: Beautiful UI for testing the function

## Usage

### Test Interface

Access the function URL via GET request to see the test interface:
```
https://your-function-url.appwrite.global/
```

### API Endpoint

Send a POST request with a JSON body:

```bash
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a synthwave band inspired by 80s sci-fi movies",
    "userId": "optional-user-id"
  }'
```

### From Frontend (JavaScript)

```javascript
// Using fetch
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a punk rock band inspired by The Clash',
    userId: currentUser.$id // optional
  })
});

const result = await response.json();
console.log(result.bandId); // Use this to navigate to the band page

// Using Appwrite SDK
const execution = await functions.createExecution(
  'generate-band-v2',
  JSON.stringify({ prompt: 'Your prompt here' }),
  false
);
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Creative description of the band you want to generate |
| userId | string | No | User ID to associate with the band (defaults to 'anonymous') |

### Response

```json
{
  "success": true,
  "bandId": "generated-band-id",
  "bandName": "Neon Dreamscape",
  "albumId": "generated-album-id",
  "albumTitle": "Digital Horizons",
  "songCount": 10,
  "visualAssets": {
    "logoUrl": "https://...",
    "albumCoverUrl": "https://...",
    "bandPhotoUrl": "https://..."
  },
  "message": "Band generation completed successfully"
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ANTHROPIC_API_KEY | Yes | Your Anthropic API key for Claude |
| FAL_API_KEY | No | Your FAL.ai API key for image generation |

### Function Settings

- **Runtime**: Node.js 18.0
- **Timeout**: 300 seconds (5 minutes)
- **Execute**: Any (public access)
- **Entry Point**: `src/main.js`

### Required Scopes

The function needs the following Appwrite scopes:
- `databases.write` - To create band, album, and song documents
- `documents.write` - To update documents
- `documents.read` - To read documents

## Database Schema (Actual)

The function uses these collections in the `mitchly-music-db` database:

### Bands Collection
- `userId` (string, 36)
- `bandName` (string, 255)
- `status` (enum): 'draft', 'generating', 'published', 'failed'
- `primaryGenre` (string, 255)
- `profileData` (string, 65535) - JSON string of full profile
- `origin` (string, 100)
- `formationYear` (integer, 1900-2100)
- `createdBy` (string, 50)
- `aiInstructions` (string, 5000)
- `logoPrompt` (string, 1000)
- `bandPhotoPrompt` (string, 16384)
- `albumTitle` (string, 255)
- `albumDescription` (string, 1000)
- `trackCount` (integer, default: 0)
- `logoUrl` (string, 500)
- `imageUrl` (string, 500)
- `albumCoverUrl` (string, 500)
- `bandPhotoUrl` (string, 500)
- `userPrompt` (string, 5000)
- `generationError` (string, 16384)

### Albums Collection
- `bandId` (string, 36) - Required
- `title` (string, 255) - Required
- `description` (string, 1000)
- `concept` (string, 2000)
- `trackCount` (integer, default: 8)
- `aiInstructions` (string, 5000)
- `status` (enum): 'draft', 'generating', 'completed', 'failed'
- `userPrompt` (string, 5000)
- `coverUrl` (string, URL)
- `releaseYear` (integer)
- `conceptData` (string, 20000)
- `coverPrompt` (string, 16384)
- `generationError` (string, 16384)

### Songs Collection
- `bandId` (string, 36) - Required
- `albumId` (string, 36)
- `title` (string, 255) - Required
- `trackNumber` (integer) - Required
- `lyrics` (string, 10000) - Required
- `description` (string, 500)
- `status` (string, 50, default: 'pending')
- `artistDescription` (string, 500)
- `audioStatus` (string, 50)
- `audioUrl` (string, 500)
- `audioFlacUrl` (string, URL)
- `audioDuration` (double)
- `audioError` (string, 500)
- `audioGeneratedAt` (datetime)
- `audioCompletedAt` (datetime)
- `murekaTaskId` (string, 100)
- `aiInstructions` (string, 16384)
- `checkAttempts` (integer, default: 0)
- `totalCheckAttempts` (integer)
- `lastStatusCheck` (string, 255)

## Development

### Local Testing

1. Install dependencies:
```bash
cd appwrite-functions/generate-band-v2
npm install
```

2. Set environment variables:
```bash
export ANTHROPIC_API_KEY=your-key
export FAL_API_KEY=your-key # optional
```

3. Deploy to Appwrite:
```bash
appwrite functions createDeployment \
  --functionId=generate-band-v2 \
  --entrypoint='src/main.js' \
  --code=.
```

### Error Handling

The function includes comprehensive error handling:
- Validates required fields
- Updates band status to 'failed' on errors
- Returns descriptive error messages
- Logs detailed error information

## Example Prompts

- "Create a synthwave band inspired by 80s sci-fi movies and Japanese city pop"
- "Generate a folk rock band that combines Celtic mythology with modern environmental themes"
- "Design a progressive metal band influenced by classical composers and space exploration"
- "Create an indie pop duo that makes music about small town life and coming of age"

## Workflow

1. User sends POST request with band concept
2. Function creates band document with 'generating' status
3. Anthropic Claude generates complete band profile
4. Function creates album and song stub documents
5. FAL.ai generates visual assets (if configured)
6. Function updates band status to 'published'
7. Returns band ID and summary to user
