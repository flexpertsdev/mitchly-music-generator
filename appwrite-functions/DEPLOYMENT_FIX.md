# Appwrite Functions - Deployment Fix Guide

## Issue
The functions are failing with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'node-appwrite'` because dependencies are not being included in the deployment.

## Root Cause
When deploying functions to Appwrite, you need to ensure all dependencies are included in the deployment package. The deployment script runs `npm install` locally but doesn't bundle the `node_modules` when deploying.

## Solution

### Option 1: Deploy with Dependencies (Recommended)

Update the deploy-functions.js script to include node_modules:

```javascript
// In deploy-functions.js, update the deployment command:
execCommand(`appwrite functions createDeployment --functionId="${func.id}" --entrypoint="${func.entrypoint}" --code="." --activate`);
```

Make sure you're in the function directory when running this, and the `--code="."` includes everything including node_modules.

### Option 2: Manual Deployment with Dependencies

For each function, manually deploy with dependencies:

```bash
cd /Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-audio
npm install
appwrite functions createDeployment \
  --functionId="generate-audio" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

### Option 3: Use Appwrite's Build Commands

Configure each function to install dependencies during build:

```bash
appwrite functions update \
  --functionId="generate-audio" \
  --buildCommands="npm install"
```

## Function Triggers Explanation

Yes, the functions are self-filtering! Here's how it works:

### Generate Lyrics Function
- **Trigger**: `databases.mitchly-music-db.collections.songs.documents.*.update`
- **Filter**: Only processes when `lyricsStatus === 'generating'`
- **Action**: Generates lyrics and updates the song document

### Generate Audio Function  
- **Trigger**: `databases.mitchly-music-db.collections.songs.documents.*.update`
- **Filter**: Only processes when `audioStatus === 'generating'`
- **Action**: Initiates audio generation with Mureka API

### Poll Audio Status Function
- **Trigger**: Scheduled every 5 minutes
- **Filter**: Finds all songs with `audioStatus === 'polling'`
- **Action**: Checks Mureka API for completion

This pattern allows multiple functions to listen to the same collection updates without conflicts.

## Updated Architecture Flow

### Band Generation
1. User submits form → Creates band with `status: 'draft'`
2. Appwrite triggers `generate-band` function
3. Function creates profile, images, album, and songs
4. Updates band `status: 'published'`

### Lyrics Generation  
1. User clicks "Generate Lyrics" → Updates song `lyricsStatus: 'generating'`
2. Appwrite triggers `generate-lyrics` function
3. Function generates lyrics using Anthropic
4. Updates song with lyrics and `lyricsStatus: 'completed'`

### Audio Generation
1. User clicks "Generate Audio" → Updates song `audioStatus: 'generating'`
2. Appwrite triggers `generate-audio` function
3. Function initiates Mureka generation
4. Updates song with taskId and `audioStatus: 'polling'`
5. Poll function checks status every 5 minutes
6. When complete, updates song with audioUrl and `audioStatus: 'completed'`

## Quick Deployment Commands

```bash
# Set environment variables
export APPWRITE_API_KEY="your-api-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export FAL_API_KEY="your-fal-key"
export MUREKA_API_KEY="your-mureka-key"

# Deploy all functions
cd /Users/jos/Developer/mitchly-music-generator/appwrite-functions
node deploy-functions.js
```

## Testing the Functions

1. **Test Band Generation**:
   ```javascript
   // Create a band document with status 'draft'
   const band = await bandService.create({
     name: "Test Band",
     concept: "Rock band",
     status: "draft"
   });
   ```

2. **Test Lyrics Generation**:
   ```javascript
   // Update a song's lyricsStatus
   await songService.update(songId, {
     lyricsStatus: "generating"
   });
   ```

3. **Test Audio Generation**:
   ```javascript
   // Update a song's audioStatus
   await songService.update(songId, {
     audioStatus: "generating"
   });
   ```

## Monitoring

Check function logs in Appwrite Console:
1. Go to Functions section
2. Select a function
3. Click on "Logs" tab
4. View execution logs and errors
