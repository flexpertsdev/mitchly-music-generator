# Spotify Authentication Setup

## Overview

This app uses Spotify OAuth 2.0 to authenticate users and analyze their music taste to generate AI bands.

## Setup Instructions

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in:
   - App name: "Mitchly Music Generator"
   - App description: "AI-powered band generator based on your music taste"
   - Redirect URI: `http://localhost:5173/spotify-callback` (for development)
   - Add production URI when deploying: `https://yourdomain.com/spotify-callback`
4. Check "Web API" under "Which API/SDKs are you planning to use?"
5. Save your Client ID and Client Secret

### 2. Configure Appwrite Functions

#### Environment Variables

Add these to each Spotify-related function:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

#### Deploy Functions

1. **spotify-auth-url**
   ```bash
   cd appwrite-functions/spotify-auth-url
   npm install
   # Deploy via Appwrite Console or CLI
   ```

2. **spotify-callback**
   ```bash
   cd appwrite-functions/spotify-callback
   npm install
   # Deploy via Appwrite Console or CLI
   ```

3. **generate-guest-bands**
   ```bash
   cd appwrite-functions/generate-guest-bands
   npm install
   # Deploy via Appwrite Console or CLI
   ```

### 3. Database Schema Updates

Add these collections if not already present:

#### user_preferences Collection
- `userId` (string, 36) - Required
- `spotifyId` (string, 255)
- `topArtists` (string, 65535) - JSON
- `topTracks` (string, 65535) - JSON
- `topGenres` (string, 16384) - JSON
- `audioFeatures` (string, 16384) - JSON
- `createdAt` (datetime)
- `updatedAt` (datetime)

### 4. Install Frontend Dependencies

```bash
npm install pinia vue-sonner
```

### 5. Authentication Flow

1. User clicks "Continue with Spotify" on `/auth`
2. `spotify-auth-url` function generates OAuth URL
3. User is redirected to Spotify for authorization
4. Spotify redirects back to `/spotify-callback` with code
5. `spotify-callback` function exchanges code for token and fetches user data
6. User data is analyzed and stored
7. AI bands are generated based on music taste

## Data Structure

### Spotify Data Collected
- **User Profile**: Display name, email, country, subscription type
- **Top Artists**: Up to 50 most-listened artists (medium term)
- **Top Tracks**: Up to 50 most-listened tracks (medium term)
- **Audio Features**: Aggregated metrics (energy, danceability, mood, etc.)
- **Recently Played**: Last 50 played tracks

### Band Generation Approach

For authenticated users:
1. Analyze top artists for genre patterns
2. Extract audio features to understand preferred sound
3. Identify unique combinations and influences
4. Generate bands that match user's taste profile

For guest users:
1. Use provided favorite artists as reference
2. Apply selected genre preferences
3. Generate bands based on description and inputs

## Security Considerations

1. **Never expose** Spotify Client Secret in frontend code
2. **Always validate** redirect URIs
3. **Use state parameter** for CSRF protection
4. **Store tokens securely** (we only store aggregated data, not tokens)
5. **Limit scopes** to only what's needed

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URI in Spotify app matches exactly
   - Include protocol (http/https)
   - Check for trailing slashes

2. **"Missing credentials"**
   - Verify environment variables are set in Appwrite functions
   - Check function logs for errors

3. **"Failed to fetch user data"**
   - Ensure all required scopes are included
   - Check if user has sufficient Spotify data
   - Verify API endpoints are correct

## Testing

1. Create a test Spotify account with listening history
2. Test auth flow end-to-end
3. Verify data is correctly stored
4. Check band generation quality
5. Test error handling for edge cases
