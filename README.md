# Mitchly Music Generator

A Vue.js application for creating comprehensive band profiles and AI-optimized song content for platforms like Mureka.ai.

## Features

- 🎵 **AI-Powered Generation**: Uses Claude 3.5 Sonnet to create detailed band profiles
- 📱 **Mobile-First Design**: Optimized for mobile devices with desktop enhancements
- 🎨 **Professional Styling**: Clean, modern interface with Mitchly branding
- 📋 **Copy-Paste Ready**: Formatted content ready for AI music platforms
- ⚡ **Individual Song Generation**: Generate unique songs with complete lyrics
- 🎯 **Mureka.ai Optimized**: Character limits and formatting for AI music platforms

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=6761a31600224c0e82df
   VITE_APPWRITE_DATABASE_ID=mitchly-music-db
   VITE_MUREKA_API_KEY=your_mureka_api_key_here
   ```

3. **Development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Appwrite Configuration

The app uses Appwrite for backend services (database and storage). It includes automatic fallback to localStorage when Appwrite is unavailable.

### Setting up Appwrite

1. **Create an Appwrite Account:**
   - Go to [Appwrite Cloud](https://cloud.appwrite.io)
   - Create a new project or use existing project ID: `6761a31600224c0e82df`

2. **Configure CORS (Important!):**
   - Go to your Appwrite Console
   - Navigate to **Project Settings** → **Platforms**
   - Add a **Web Platform** with these URLs:
     - `http://localhost:5173` (for local development)
     - `https://mitchlymusic.netlify.app` (for production)
     - Your custom domain if applicable

3. **Create Database:**
   - Go to **Databases** → **Create Database**
   - Name: `mitchly-music-db`
   - Create two collections:
     - `bands` - for band profiles
     - `songs` - for song data

4. **Create Storage Bucket:**
   - Go to **Storage** → **Create Bucket**
   - Bucket ID: `mitchly-music`
   - Name: "Mitchly Music Files"
   - Enable file security if needed

### Database Schema

**Bands Collection:**
- `bandName` (string) - Band/artist name
- `primaryGenre` (string) - Main genre
- `profileData` (string/JSON) - Complete profile data
- `imageUrl` (string, optional) - Band image URL
- `logoUrl` (string, optional) - Band logo URL

**Songs Collection:**
- `bandId` (string) - Reference to band document
- `title` (string) - Song title
- `trackNumber` (integer) - Track position
- `lyrics` (string) - Song lyrics
- `description` (string, optional) - Song description
- `audioUrl` (string, optional) - Generated audio URL
- `murekaTaskId` (string, optional) - Mureka generation ID
- `status` (string) - Generation status

### Offline Mode

When Appwrite is unavailable (CORS issues, network problems, etc.), the app automatically:
- Switches to localStorage for data persistence
- Shows an "Offline Mode" indicator in the header
- Saves bands and songs locally with `local_` prefix IDs
- Syncs data when connection is restored (manual sync required)

## Deployment to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag and drop the `dist` folder to Netlify
   - Or connect your Git repository for automatic deployments

3. **Environment Variables on Netlify:**
   - Go to Site settings > Environment variables
   - Add `VITE_ANTHROPIC_API_KEY` with your Anthropic API key

## Project Structure

```
src/
├── components/
│   ├── ConceptInput.vue     # Input form for musical concepts
│   └── BandProfile.vue      # Display band profiles and songs
├── services/
│   └── anthropic.js         # Anthropic API integration
├── App.vue                  # Main application component
├── main.js                  # Application entry point
└── style.css               # Global styles and animations
```

## Usage

1. **Simple Mode**: Enter a musical concept description and let AI generate everything
2. **Advanced Mode**: Fill in detailed forms for more control
3. **Generate Songs**: Create individual songs with unique lyrics
4. **Copy Content**: Ready-to-use formatting for Mureka.ai and similar platforms

## API Requirements

- Anthropic API key with Claude 3.5 Sonnet access
- Sufficient token allowance for generation requests

## License

© 2025 Mitchly. All rights reserved.
