# Quick Deploy Guide for generate-band Function

## Step 1: Set Environment Variables in Appwrite Console

**IMPORTANT**: Environment variables must be set at the FUNCTION level, not globally!

1. Go to Appwrite Console: https://cloud.appwrite.io
2. Navigate to: **Functions** → **generate-band** → **Settings**
3. Scroll down to **Variables** section
4. Click **Add Variable** and add these THREE variables:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `APPWRITE_API_KEY` | Get from Console > Settings > API Keys | Create new key with Database read/write permissions |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key | From https://console.anthropic.com |
   | `FAL_API_KEY` | Your FAL.ai API key (optional) | For image generation |

## Step 2: Deploy the Function

Run the deployment script:
```bash
cd /Users/jos/Developer/mitchly-music-generator/appwrite-functions
./deploy-generate-band.sh
```

Or deploy manually:
```bash
cd generate-band
appwrite functions createDeployment \
  --functionId="generate-band" \
  --entrypoint="src/index.js" \
  --activate=true \
  --code="."
```

## Step 3: Verify Deployment

Check that the function is active:
```bash
export APPWRITE_API_KEY="your-api-key-here"
node check-deployment.js
```

## Step 4: Test the Function

Create a test band:
```bash
export APPWRITE_API_KEY="your-api-key-here"
node test-function.js
```

## Step 5: Monitor Execution

1. Go to: https://cloud.appwrite.io/console/project-flexos/functions/function-generate-band/executions
2. Look for recent executions
3. Check logs for any errors

## Troubleshooting

### "Cannot read properties of undefined (reading 'APPWRITE_API_KEY')"
- Environment variables are NOT set in the function settings
- Go to Function Settings → Variables section
- Add the required variables

### Function not triggering
- Check Events tab: Should have `databases.mitchly-music-db.collections.bands.documents.*.create`
- Verify the band document has `status: 'draft'`
- Ensure function deployment is active

### Function completes too quickly (< 1 second)
- Missing environment variables
- Check execution logs for early exit

### API errors
- Verify API keys are valid
- Check you have credits/quota for Anthropic and FAL.ai
- Ensure APPWRITE_API_KEY has database permissions

## What the Function Does

When a band is created with `status: 'draft'`:

1. **Triggers** on band document creation
2. **Generates** band profile using Anthropic Claude
3. **Creates** album and song stub documents
4. **Generates** images using FAL.ai (optional)
5. **Updates** band status to 'published'

## Success Indicators

✅ Function execution takes 10-30 seconds
✅ Band status changes from 'draft' → 'generating' → 'published'
✅ Band gets populated with name, genre, profile data
✅ Album document is created
✅ Song stubs are created
✅ Images are generated (if FAL_API_KEY is set)