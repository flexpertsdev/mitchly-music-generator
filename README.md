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
   ```

3. **Development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

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
