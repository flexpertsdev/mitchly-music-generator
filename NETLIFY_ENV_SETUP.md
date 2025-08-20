# Netlify Environment Variables Setup

Add these environment variables in your Netlify dashboard under Site Settings > Environment Variables:

## Required Variables

### Frontend (Public) Variables
These are exposed to the browser and start with `VITE_`:

```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=flexos
VITE_MUREKA_API_KEY=your_mureka_api_key
```

### Backend (Secret) Variables  
These are only accessible in Netlify Functions:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
FAL_API_KEY=your_fal_api_key
APPWRITE_API_KEY=your_appwrite_server_api_key
```

## Optional Variables
```
VITE_APPWRITE_DATABASE_ID=mitchly-music-db
```

## Important Notes

1. **VITE_ prefix**: Required for any variable that needs to be accessible in the frontend
2. **No VITE_ prefix**: For sensitive keys that should only be used server-side
3. **Local development**: Use `.env` file (already in .gitignore)
4. **Production**: Set these in Netlify dashboard, NOT in code

## Verification

After setting up, redeploy your site and check:
1. Band generation works (uses ANTHROPIC_API_KEY)
2. Image generation works (uses FAL_API_KEY)  
3. Database saves work (uses APPWRITE_API_KEY)
4. Audio generation works (uses VITE_MUREKA_API_KEY)