# Appwrite Functions Setup

This directory contains the Appwrite functions that handle the AI generation workflows for Mitchly Music Generator.

## Functions

### 1. generate-band
- **Trigger**: New band document created with `status: 'draft'`
- **Purpose**: Generates complete band profile, creates album and song records, generates visual assets
- **Dependencies**: Anthropic API, FAL.ai API

### 2. generate-lyrics (TODO)
- **Trigger**: Song document updated with `status: 'generating_lyrics'`
- **Purpose**: Generates lyrics for individual songs using band and album context

### 3. generate-audio (TODO)
- **Trigger**: Song document updated with `audioStatus: 'generating'`
- **Purpose**: Initiates audio generation with Mureka API

### 4. poll-audio-status (TODO)
- **Trigger**: Scheduled execution
- **Purpose**: Polls Mureka API for audio generation status

## Deployment

### Deploy using Appwrite CLI:

```bash
# Install Appwrite CLI
npm install -g appwrite

# Login to your project
appwrite login

# Deploy function
appwrite functions createDeployment \
  --functionId=generate-band \
  --entrypoint='src/index.js' \
  --code=./generate-band \
  --activate=true
```

### Or deploy using Appwrite Console:

1. Go to Functions in Appwrite Console
2. Create new function
3. Upload the function directory
4. Set environment variables (see below)
5. Set triggers (see below)

## Environment Variables

Each function needs these environment variables:

```
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=flexos
APPWRITE_API_KEY=your-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
FAL_API_KEY=your-fal-api-key
MUREKA_API_KEY=your-mureka-api-key
```

## Event Triggers

### generate-band
- Event: `databases.mitchly-music-db.collections.bands.documents.*.create`
- Additional filter: Check for `status === 'draft'` in the function code

### generate-lyrics
- Event: `databases.mitchly-music-db.collections.songs.documents.*.update`
- Additional filter: Check for `status === 'generating_lyrics'` in the function code

### generate-audio
- Event: `databases.mitchly-music-db.collections.songs.documents.*.update`
- Additional filter: Check for `audioStatus === 'generating'` in the function code

## Testing

Test the generate-band function by creating a band document:

```javascript
// In your frontend
await databases.createDocument(
  'mitchly-music-db',
  'bands',
  ID.unique(),
  {
    bandName: 'Temporary',
    primaryGenre: 'Rock',
    status: 'draft',
    userPrompt: 'Create a punk rock band with environmental themes',
    profileData: '{}'
  }
);
```

## Architecture Benefits

1. **Resilient**: Functions run server-side, no timeout issues
2. **User-friendly**: Users can leave and come back
3. **Clean UI**: Buttons disable based on status fields
4. **Error handling**: Proper error states stored in DB
5. **Scalable**: Can handle multiple generations simultaneously

## Database Schema Changes

The functions expect these collection schemas:

### Bands Collection
- status: enum ['draft', 'generating', 'published', 'failed']
- userId: string (optional)
- userPrompt: string
- aiInstructions: string
- generationError: string

### Albums Collection
- bandId: string (required)
- status: enum ['draft', 'generating', 'completed', 'failed']
- aiInstructions: string
- coverUrl: url
- coverPrompt: string

### Songs Collection
- albumId: string (optional)
- aiInstructions: string
- audioStatus: string
- audioError: string
