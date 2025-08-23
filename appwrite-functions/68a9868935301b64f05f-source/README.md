# Generate Music with Mureka Function

This Appwrite function integrates with Mureka AI to generate music based on song data stored in your Appwrite database.

## Overview

The function accepts a POST request with a `songId`, retrieves the song data from the database, and sends a request to Mureka AI to generate music based on the song's lyrics and metadata.

## Request Format

```json
POST /v1/functions/{functionId}/executions
{
  "songId": "string"
}
```

## Function Flow

1. **Parse Request**: Extract `songId` from the request body
2. **Fetch Song Data**: Retrieve the song document from the `songs` collection in the `mitchly-music-db` database
3. **Generate Music**: Send a request to Mureka AI with:
   - Lyrics from the song document
   - A prompt generated from the song's title, description, track number, and artist description
4. **Update Database**: Store the Mureka task ID back in the song document for tracking

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Music generation started",
  "songId": "string",
  "murekaTaskId": "string",
  "status": "string",
  "traceId": "string"
}
```

### Error Responses

- **400 Bad Request**: Invalid or missing request body
- **404 Not Found**: Song not found in database
- **500 Internal Server Error**: Server or API errors

## Environment Variables

- `MUREKA_API_KEY`: Your Mureka AI API key (required)
- `APPWRITE_FUNCTION_API_ENDPOINT`: Appwrite API endpoint (auto-provided)
- `APPWRITE_FUNCTION_PROJECT_ID`: Appwrite project ID (auto-provided)

## Database Schema

The function expects a `songs` collection in the `mitchly-music-db` database with the following fields:

- `lyrics`: String - The song lyrics
- `title`: String (optional) - Song title
- `description`: String (optional) - Song description
- `trackNumber`: String/Number (optional) - Track number
- `artistDescription`: String (optional) - Artist description

The function will add/update these fields:
- `murekaTaskId`: String - The Mureka task ID
- `murekaStatus`: String - The task status
- `murekaCreatedAt`: Number - Task creation timestamp

## Deployment

1. Set up your environment variables in the Appwrite Console
2. Deploy the function using the Appwrite CLI or Console
3. Make sure the function has proper permissions to access the database

## Testing

You can test the function using curl:

```bash
curl -X POST https://[YOUR_APPWRITE_ENDPOINT]/v1/functions/[FUNCTION_ID]/executions \
  -H "X-Appwrite-Project: [PROJECT_ID]" \
  -H "X-Appwrite-Key: [API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"songId": "your-song-id"}'
```

## Notes

- The prompt is limited to 1000 characters as per Mureka's API requirements
- The function uses the 'auto' model for Mureka AI
- Streaming is enabled for the Mureka API response
- Make sure your Mureka API key has the necessary permissions
