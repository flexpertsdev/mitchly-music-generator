# Appwrite Setup for Mitchly Music

## Platform Configuration (Required for CORS)

### Add Web Platforms in Appwrite Console

1. **Login to Appwrite Console**
   - Go to https://cloud.appwrite.io (or your self-hosted console)
   - Select the "flexos" project

2. **Navigate to Settings → Platforms**

3. **Add Production Platform**
   - Click "Add Platform" → "Web App"
   - Name: `Mitchly Music (Production)`
   - Hostname: `mitchlymusic.netlify.app`
   - Click "Create"

4. **Add Development Platform** 
   - Click "Add Platform" → "Web App"
   - Name: `Mitchly Music (Dev)`
   - Hostname: `localhost`
   - Click "Create"

5. **Add Preview Platforms (Optional)**
   If using Netlify deploy previews:
   - Add platform with hostname: `*.netlify.app`
   - This allows all Netlify preview deploys to work

## Database Configuration

### Database Structure
- Database ID: `mitchly-music-db`
- Collections:
  - `bands` - Stores band profiles
  - `songs` - Stores song data

### Required API Key Permissions

Create an API key with the following scopes:
- `databases.read`
- `databases.write`
- `storage.read` 
- `storage.write`

## Storage Configuration

### Create Storage Bucket
1. Go to Storage in Appwrite Console
2. Create bucket with ID: `band-images`
3. Set permissions:
   - Read: Any
   - Write: Users (or API Key)

## Environment Variables

### For Netlify (Production)
Set in Netlify Dashboard → Site Settings → Environment Variables:
```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=flexos
VITE_APPWRITE_DATABASE_ID=mitchly-music-db
APPWRITE_API_KEY=your_server_api_key_here
```

### For Local Development
Create `.env` file:
```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=flexos
VITE_APPWRITE_DATABASE_ID=mitchly-music-db
```

## Troubleshooting CORS Issues

If you see CORS errors:
1. Verify the hostname in Appwrite matches exactly (including https://)
2. Check that the platform is enabled (not disabled)
3. Clear browser cache and cookies
4. Try in incognito/private browsing mode

## Testing the Configuration

1. After adding platforms, redeploy on Netlify
2. Open browser console
3. Try generating a band
4. Check for CORS errors in console

If CORS errors persist, double-check:
- The exact domain in the error message
- That domain is added as a platform in Appwrite
- No typos in the hostname configuration