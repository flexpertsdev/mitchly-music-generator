# Generate Band Function - Event Trigger Setup

## Overview
The generate-band function is triggered when a new band document is created with status 'draft'. This happens when users submit the band creation form from the frontend.

## Setting Up the Event Trigger

### 1. Deploy the Function
First, make sure the function is deployed:
```bash
cd appwrite-functions
node deploy-functions.js generate-band
```

### 2. Configure the Event Trigger

1. Go to your Appwrite Console
2. Navigate to Functions → generate-band
3. Click on "Settings" tab
4. Scroll to "Events" section
5. Add the following event:

**Event Pattern:**
```
databases.mitchly-music-db.collections.bands.documents.*.create
```

This will trigger the function whenever a new document is created in the bands collection.

### 3. Environment Variables

Make sure these environment variables are set in the function:
- `APPWRITE_API_KEY` - API key with appropriate permissions
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `FAL_API_KEY` - Your FAL.ai API key

## How It Works

1. User fills out the band creation form in the frontend
2. Frontend creates a band document with:
   - `status: 'draft'`
   - `prompt: <user's input>`
   - `name: 'Generating...'` (placeholder)
   - `advancedData: {...}` (if using advanced form)

3. Appwrite triggers the generate-band function
4. Function checks if the document has `status: 'draft'`
5. Function updates status to `'generating'`
6. Function generates:
   - Band profile using Anthropic
   - Visual assets using FAL.ai
   - Album record
   - Song stubs
7. Function updates band status to `'published'` when complete

## Frontend Integration

The frontend (BandPage.vue) polls the band document every 2 seconds while status is 'draft' or 'generating', and displays a progress UI until the band is published.

## Testing

To test the event trigger:

1. Create a test band document directly in Appwrite console:
```json
{
  "status": "draft",
  "prompt": "Create a punk rock band inspired by The Clash",
  "name": "Generating...",
  "createdAt": "2024-01-20T10:00:00Z"
}
```

2. Check the function execution logs to see if it was triggered
3. Monitor the band document to see status updates

## Troubleshooting

If the function isn't triggering:
1. Check that the event pattern is correct
2. Verify the function has proper permissions (API key scopes)
3. Check function logs for any errors
4. Ensure the database ID and collection ID match exactly
