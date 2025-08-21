# Quick Deployment Guide for Mitchly Music Generator Functions

Since you already have 3 of the 4 functions created in Appwrite, here's how to complete the setup:

## 1. Set Environment Variables

First, create a `.env` file in your project root if you don't have one:

```bash
# /Users/jos/Developer/mitchly-music-generator/.env
APPWRITE_API_KEY=your-appwrite-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
FAL_API_KEY=your-fal-api-key
MUREKA_API_KEY=your-mureka-api-key
```

## 2. Manual Deployment Steps

Since the functions already exist, you just need to deploy the code:

### Deploy Generate Band Function

```bash
cd /Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band
npm install

# Deploy using Appwrite CLI
appwrite deploy function \
  --functionId="generate-band" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

### Deploy Generate Lyrics Function

```bash
cd ../generate-lyrics
npm install

appwrite deploy function \
  --functionId="generate-lyrics" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

### Deploy Generate Audio Function

```bash
cd ../generate-audio
npm install

appwrite deploy function \
  --functionId="generate-audio" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

### Deploy Poll Audio Status Function

```bash
cd ../poll-audio-status
npm install

appwrite deploy function \
  --functionId="poll-audio-status" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

## 3. Add Missing Environment Variables

You need to add your API keys to each function. Here's a quick script to do it:

```bash
# Add your API keys here
export APPWRITE_API_KEY="your-appwrite-api-key"
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export FAL_API_KEY="your-fal-api-key"
export MUREKA_API_KEY="your-mureka-api-key"

# Generate Band Variables
appwrite functions createVariable --functionId="generate-band" --key="APPWRITE_API_KEY" --value="$APPWRITE_API_KEY"
appwrite functions createVariable --functionId="generate-band" --key="ANTHROPIC_API_KEY" --value="$ANTHROPIC_API_KEY"
appwrite functions createVariable --functionId="generate-band" --key="FAL_API_KEY" --value="$FAL_API_KEY"

# Generate Lyrics Variables
appwrite functions createVariable --functionId="generate-lyrics" --key="APPWRITE_API_KEY" --value="$APPWRITE_API_KEY"
appwrite functions createVariable --functionId="generate-lyrics" --key="ANTHROPIC_API_KEY" --value="$ANTHROPIC_API_KEY"

# Generate Audio Variables
appwrite functions createVariable --functionId="generate-audio" --key="APPWRITE_API_KEY" --value="$APPWRITE_API_KEY"
appwrite functions createVariable --functionId="generate-audio" --key="MUREKA_API_KEY" --value="$MUREKA_API_KEY"

# Poll Audio Status Variables
appwrite functions createVariable --functionId="poll-audio-status" --key="APPWRITE_API_KEY" --value="$APPWRITE_API_KEY"
appwrite functions createVariable --functionId="poll-audio-status" --key="MUREKA_API_KEY" --value="$MUREKA_API_KEY"
```

## 4. Configure Events

Update the functions with proper event triggers:

```bash
# Generate Band - triggers on band creation with status 'draft'
appwrite functions update \
  --functionId="generate-band" \
  --events="databases.mitchly-music-db.collections.bands.documents.*.create" \
  --timeout=900

# Generate Lyrics - triggers on song update with status 'generating_lyrics'
appwrite functions update \
  --functionId="generate-lyrics" \
  --events="databases.mitchly-music-db.collections.songs.documents.*.update" \
  --timeout=300

# Generate Audio - triggers on song update with audioStatus 'generating'
appwrite functions update \
  --functionId="generate-audio" \
  --events="databases.mitchly-music-db.collections.songs.documents.*.update" \
  --timeout=300

# Poll Audio Status - runs on schedule to check Mureka task status
appwrite functions update \
  --functionId="poll-audio-status" \
  --schedule="*/5 * * * *" \
  --timeout=300
```

## 5. Test the Functions

Create a test script to verify everything works:

```javascript
// test-functions.js
import { Client, Databases, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('flexos');

const databases = new Databases(client);

async function testBandGeneration() {
  console.log('Testing band generation...');
  
  const band = await databases.createDocument(
    'mitchly-music-db',
    'bands',
    ID.unique(),
    {
      bandName: 'Test Band',
      primaryGenre: 'Rock',
      status: 'draft',
      userPrompt: 'Create a psychedelic rock band inspired by Pink Floyd',
      profileData: '{}',
      origin: '',
      formationYear: 2024,
      albumTitle: '',
      albumDescription: '',
      trackCount: 8
    }
  );
  
  console.log('Band created:', band.$id);
  console.log('Check Appwrite Console → Functions → Executions to monitor progress');
}

testBandGeneration();
```

## 6. Monitor Functions

Go to your Appwrite Console:
https://cloud.appwrite.io/console/project/flexos/functions

Check each function's:
- Executions tab for logs
- Variables tab to ensure all env vars are set
- Settings tab to verify events/schedule

## Common Issues

1. **Function not triggering**: Make sure the event matches exactly and the document has the right status field
2. **API key errors**: Double-check all environment variables are set correctly
3. **Timeout errors**: Increase timeout in function settings (max 900 seconds)

## Next Steps

Once all functions are deployed and tested:
1. Update your frontend to use the new status-based flow
2. Remove the old Netlify functions
3. Set up monitoring/alerts for failed executions