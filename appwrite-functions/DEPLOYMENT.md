# Appwrite Functions Deployment Guide

## Prerequisites

1. Install Appwrite CLI:
```bash
npm install -g appwrite
```

2. Login to Appwrite:
```bash
appwrite login
```

3. Select your project:
```bash
appwrite init project
# Select "Link this directory to an existing Appwrite project"
# Choose your project from the list
```

## Environment Variables

Each function needs specific environment variables set in the Appwrite Console:

### generate-band Function
Required variables:
- `APPWRITE_API_KEY` - API key with permissions for database read/write
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude
- `FAL_API_KEY` - Your FAL.ai API key for image generation

### generate-lyrics Function
Required variables:
- `APPWRITE_API_KEY` - API key with permissions for database read/write
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude

### generate-audio Function
Required variables:
- `APPWRITE_API_KEY` - API key with permissions for database read/write
- `MUREKA_API_KEY` - Your Mureka API key for audio generation

## Deployment Steps

### Option 1: Deploy via CLI

1. Navigate to the function directory:
```bash
cd appwrite-functions/generate-band
```

2. Deploy the function:
```bash
appwrite functions createDeployment \
  --functionId="generate-band" \
  --entrypoint="src/index.js" \
  --activate=true \
  --code="."
```

### Option 2: Deploy via Console

1. Go to Appwrite Console > Functions
2. Click "Create Function"
3. Settings:
   - Name: Generate Band
   - Function ID: generate-band
   - Runtime: Node.js 18.0
   - Entrypoint: src/index.js
   - Build Commands: npm install

4. Add Environment Variables:
   - Click on Settings tab
   - Add each required variable

5. Set Events (Triggers):
   - Go to Events tab
   - Add: `databases.mitchly-music-db.collections.bands.documents.*.create`
   - Add: `databases.mitchly-music-db.collections.bands.documents.*.update`

6. Deploy:
   - Go to Deployments tab
   - Click "Create Deployment"
   - Upload the function code (zip the function directory)
   - Activate the deployment

## Testing

1. Create a test band document:
```javascript
const band = await bandService.create({
  userPrompt: "Create a punk rock band from Seattle",
  status: "draft"
});
```

2. Check function execution:
   - Go to Functions > generate-band > Executions
   - Look for recent executions
   - Check logs for any errors

## Troubleshooting

### Function not triggering
- Verify events are correctly configured
- Check that the document status is "draft"
- Ensure function is activated

### API errors
- Verify all environment variables are set
- Check API key permissions
- Verify API keys are valid and have credits

### Function timeout
- Default timeout is 300 seconds (5 minutes)
- Increase if needed in function settings

### Check logs
```bash
appwrite functions listExecutions --functionId="generate-band"
```

## Function Logic

The generate-band function:
1. Triggers when a band document is created with status "draft"
2. Calls Anthropic API to generate band profile
3. Creates album and song stub documents
4. Calls FAL.ai to generate images
5. Updates band status to "published"

The function will NOT trigger if:
- Band status is not "draft"
- Document is not in the bands collection
- Required environment variables are missing