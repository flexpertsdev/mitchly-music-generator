# Generate Band V2 - Deployment Guide

## Required Environment Variables

### Core Requirements
- `ANTHROPIC_API_KEY` - **Required** - Your Anthropic Claude API key
- `APPWRITE_FUNCTION_API_KEY` - **Required** - Appwrite API key with database permissions
- `APPWRITE_FUNCTION_API_ENDPOINT` - **Auto-provided** - Appwrite endpoint (auto-set by platform)
- `APPWRITE_FUNCTION_PROJECT_ID` - **Auto-provided** - Project ID (auto-set by platform)

### Optional
- `FAL_API_KEY` - Optional - FAL.ai API key for image generation (band photos, logos, album covers)

## Manual Deployment

1. Upload the `generate-band-v2.tar.gz` file to Appwrite Console
2. Set runtime to Node.js 18.0
3. Set build command to: `npm install`
4. Add environment variables listed above
5. Deploy!

## What's Fixed

✅ FAL.ai now uses SDK (not REST API)
✅ Static file path using correct pattern
✅ Anthropic SDK properly configured
✅ Appwrite services with proper error handling
✅ Comprehensive test page at /
✅ All dependencies in package.json

## Testing

Once deployed, visit the function URL to access the test interface. You can:
1. Enter a band concept prompt
2. Optionally specify a user ID
3. Generate a complete band with AI

The function will create:
- Band profile with backstory
- Album concept
- 10-12 song track listing
- Visual assets (if FAL_API_KEY configured)

All data is stored in Appwrite database collections:
- `bands` collection
- `albums` collection
- `songs` collection