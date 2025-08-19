# Required Netlify Environment Variables

Add these to your Netlify dashboard under **Site settings > Environment variables**:

## Anthropic API
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Mureka AI
```
MUREKA_API_KEY=your_mureka_api_key_here
VITE_MUREKA_API_KEY=your_mureka_api_key_here
```

## FAL AI (for image generation)
```
FAL_API_KEY=your_fal_api_key_here
```

## Appwrite (for database and storage)
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6761a31600224c0e82df
APPWRITE_API_KEY=standard_b6b2a675b47e70045c8ab44cf73826062e427be0a4ff1e94a803fd247bcc372c064a05c2777416935f556caff025fa036d36eb4b6d9e00775b9315791a95713c60b670accb49d13b82daeb39614e72875f619992f623de5a300fb5c0fec6b84d66a7faccacd13d4cfb56b483f879544aa297f7672c8143b6bea2b35c2a185a23
APPWRITE_DATABASE_ID=mitchly-music-db
APPWRITE_COLLECTION_ID=band-projects
APPWRITE_STORAGE_BUCKET_ID=mitchly-music
```

## Optional (for debugging)
```
WEBHOOK_URL=https://webhook.site/your-unique-url
```

---

## Netlify Functions Structure

Your `/netlify/functions/` directory should have:

```
netlify/functions/
├── generate-band-concept.js      # Main band profile generation
├── generate-song-lyrics.js       # Individual song lyrics
├── generate-mureka-audio.js      # Start Mureka audio generation
├── check-mureka-status.js        # Check Mureka generation status
├── generate-fal-image.js         # Generate images with FAL
└── appwrite-operations.js        # Save to Appwrite database/storage
```

## Usage Flow

1. **Generate Band Concept** → Returns JSON with band profile + album + song stubs
2. **Save to Appwrite** → Store the initial concept
3. **Generate Images** → Create band photo, logo, album cover with FAL
4. **Upload Images** → Store images in Appwrite Storage
5. **Generate Song Lyrics** → Create full lyrics for each track (on demand)
6. **Generate Audio** → Create audio with Mureka (on demand)
7. **Monitor Status** → Check Mureka generation progress

Each function is independent and handles its own CORS and error handling.