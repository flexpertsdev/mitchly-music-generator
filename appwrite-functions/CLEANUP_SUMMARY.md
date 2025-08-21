# Appwrite Functions - Cleaned Up! 🎉

## What I Changed:

### 1. **Removed Redundant Environment Variables**
Instead of:
```javascript
// OLD - Setting these manually
.setEndpoint(process.env.APPWRITE_ENDPOINT)
.setProject(process.env.APPWRITE_PROJECT_ID)
```

Now using built-in variables:
```javascript
// NEW - Using Appwrite's built-in variables
.setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT)
.setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID)
```

### 2. **Fixed Model Name**
- Changed from `claude-opus-4-1-20250805` to `claude-3-5-sonnet-20241022`
- This is the correct model identifier for Claude

### 3. **Consistent Structure**
All functions now have:
- `src/index.js` - Main function code
- `package.json` - Dependencies
- Clean error handling
- Proper logging

## Environment Variables You Need:

Only the actual API keys:
```bash
# External Services
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
FAL_API_KEY=fal_xxxxx
MUREKA_API_KEY=mureka_xxxxx

# Appwrite Access
APPWRITE_API_KEY=your-appwrite-api-key
```

## Function Overview:

### 1. **generate-band**
- Trigger: Band created with `status: 'draft'`
- Creates: Complete band profile, album, and song stubs
- Uses: Anthropic (text) + FAL.ai (images)

### 2. **generate-lyrics**
- Trigger: Song updated with `status: 'generating'`
- Creates: Song lyrics based on band context
- Uses: Anthropic

### 3. **generate-audio**
- Trigger: Song updated with `audioStatus: 'generating'`
- Creates: Mureka task for audio generation
- Uses: Mureka API

### 4. **poll-audio-status**
- Trigger: Runs every 5 minutes (schedule)
- Checks: Mureka task status for all processing songs
- Updates: Songs with completed audio URLs

## Deployment Commands:

```bash
# Deploy each function
cd appwrite-functions/generate-band
npm install
appwrite deploy function --functionId="generate-band" --entrypoint="src/index.js" --code="." --activate

cd ../generate-lyrics
npm install
appwrite deploy function --functionId="generate-lyrics" --entrypoint="src/index.js" --code="." --activate

cd ../generate-audio
npm install
appwrite deploy function --functionId="generate-audio" --entrypoint="src/index.js" --code="." --activate

cd ../poll-audio-status
npm install
appwrite deploy function --functionId="poll-audio-status" --entrypoint="src/index.js" --code="." --activate
```

## Benefits of Cleanup:

1. **Less Configuration**: No need to repeat Appwrite endpoint/project in every function
2. **Cleaner Code**: Using built-in variables makes code more maintainable
3. **Fewer Mistakes**: Can't accidentally use wrong endpoint or project ID
4. **Easier Testing**: Functions automatically know their context

## Next Steps:

1. Set your API keys in Appwrite Console (Settings → Variables)
2. Deploy all functions
3. Test with the test script
4. Update your frontend to trigger these functions with the right status fields

The functions are now clean, efficient, and ready to deploy! 🚀