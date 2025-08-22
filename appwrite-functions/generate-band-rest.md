{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/src/main.js`,
  `content`: `/**
 * Generate Band Function
 * Executable function that accepts POST requests with a text prompt
 */
import AppwriteService from './appwrite.js';
import AnthropicService from './anthropic.js';
import FalService from './fal.js';
import { throwIfMissing, generateVisualPrompts, getStatusPage, getTestInterface } from './utils.js';

// Constants
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';
const ALBUMS_COLLECTION = 'albums';
const SONGS_COLLECTION = 'songs';

export default async ({ req, res, log, error }) => {
  // Handle GET requests - show test interface
  if (req.method === 'GET') {
    const html = getTestInterface();
    return res.text(html, 200, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    // Validate required environment variables
    throwIfMissing(process.env, ['ANTHROPIC_API_KEY']);

    // Parse request body
    const { prompt, userId } = req.bodyJson || {};
    
    if (!prompt) {
      return res.json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      }, 400);
    }

    // Get user ID from header if not in body
    const bandUserId = userId || req.headers['x-appwrite-user-id'] || 'anonymous';
    
    log(`Generating band for user: ${bandUserId}`);
    log(`Prompt: ${prompt}`);
    
    // Initialize services
    const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
    const anthropic = new AnthropicService();
    const fal = new FalService();
    
    // Create initial band document
    const bandData = await appwrite.createBand(DATABASE_ID, BANDS_COLLECTION, {
      userId: bandUserId,
      bandName: 'Generating...',
      status: 'generating',
      userPrompt: prompt,
      createdAt: new Date().toISOString()
    });
    
    const bandId = bandData.$id;
    log(`Created band with ID: ${bandId}`);
    
    try {
      // Generate band profile
      log('Generating band profile...');
      const bandProfile = await anthropic.generateBandProfile(prompt);
      
      // Normalize AI description
      bandProfile.aiDescription = anthropic.normalizeAiDescription(bandProfile);
      
      // Generate visual prompts
      const visualPrompts = generateVisualPrompts(bandProfile);
      
      // Update band with profile data
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        bandName: bandProfile.bandName,
        primaryGenre: bandProfile.primaryGenre,
        profileData: JSON.stringify(bandProfile),
        origin: bandProfile.origin || '',
        formationYear: bandProfile.formationYear || new Date().getFullYear(),
        aiInstructions: bandProfile.bandAiInstructions || '',
        logoPrompt: visualPrompts.logo,
        albumTitle: bandProfile.albumConcept.title,
        albumDescription: bandProfile.albumConcept.description,
        trackCount: bandProfile.trackListing.length
      });
      
      log('Band profile saved');
      
      // Create album
      const album = await appwrite.createAlbum(DATABASE_ID, ALBUMS_COLLECTION, {
        bandId: bandId,
        title: bandProfile.albumConcept.title,
        description: bandProfile.albumConcept.description,
        concept: bandProfile.albumConcept.narrative || '',
        trackCount: bandProfile.trackListing.length,
        aiInstructions: bandProfile.albumAiInstructions || '',
        status: 'draft',
        coverPrompt: visualPrompts.albumCover
      });
      
      log(`Album created: ${album.$id}`);
      
      // Create song stubs
      const songPromises = bandProfile.trackListing.map((track, index) => 
        appwrite.createSong(DATABASE_ID, SONGS_COLLECTION, {
          bandId: bandId,
          albumId: album.$id,
          title: track.title,
          trackNumber: index + 1,
          description: track.description || '',
          lyrics: '',
          status: 'pending',
          artistDescription: bandProfile.aiDescription,
          aiInstructions: `Theme: ${track.theme}. ${track.description}`
        })
      );
      
      const songs = await Promise.all(songPromises);
      log(`Created ${songs.length} songs`);
      
      // Generate visual assets
      let visualAssets = {
        logoUrl: '',
        albumCoverUrl: '',
        bandPhotoUrl: ''
      };
      
      if (fal.isConfigured()) {
        log('Generating visual assets...');
        visualAssets = await fal.generateBandVisuals(visualPrompts);
        log('Visual assets generated');
      } else {
        log('FAL_API_KEY not configured, skipping image generation');
      }
      
      // Update band with final data
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        logoUrl: visualAssets.logoUrl,
        albumCoverUrl: visualAssets.albumCoverUrl,
        bandPhotoUrl: visualAssets.bandPhotoUrl,
        status: 'published'
      });
      
      // Update album cover if available
      if (visualAssets.albumCoverUrl) {
        await appwrite.updateBand(DATABASE_ID, ALBUMS_COLLECTION, album.$id, {
          coverUrl: visualAssets.albumCoverUrl,
          status: 'completed'
        });
      }
      
      log('Band generation completed');
      
      return res.json({
        success: true,
        bandId: bandId,
        bandName: bandProfile.bandName,
        albumId: album.$id,
        albumTitle: bandProfile.albumConcept.title,
        songCount: bandProfile.trackListing.length,
        visualAssets: visualAssets,
        message: 'Band generation completed successfully'
      });
      
    } catch (genError) {
      // Update band status to failed
      await appwrite.updateBand(DATABASE_ID, BANDS_COLLECTION, bandId, {
        status: 'failed',
        generationError: genError.message
      });
      throw genError;
    }
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
`
}

{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/src/appwrite.js`,
  `content`: `import { Client, Databases, ID } from 'node-appwrite';

class AppwriteService {
  constructor(apiKey) {
    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);

    this.databases = new Databases(client);
  }

  /**
   * Create band document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createBand(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }

  /**
   * Update band document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {string} bandId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateBand(databaseId, collectionId, bandId, data) {
    return await this.databases.updateDocument(
      databaseId,
      collectionId,
      bandId,
      data
    );
  }

  /**
   * Create album document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createAlbum(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }

  /**
   * Create song document
   * @param {string} databaseId
   * @param {string} collectionId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createSong(databaseId, collectionId, data) {
    return await this.databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );
  }
}

export default AppwriteService;
`
}

{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/src/anthropic.js`,
  `content`: `import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  constructor() {
    this.client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
  }

  /**
   * Generate band profile
   * @param {string} userPrompt
   * @returns {Promise<object>}
   */
  async generateBandProfile(userPrompt) {
    const message = await this.client.messages.create({
      model: \"claude-3-5-sonnet-20241022\",
      max_tokens: 4000,
      temperature: 0.7,
      system: this.getSystemPrompt(),
      messages: [{
        role: \"user\",
        content: userPrompt
      }]
    });
    
    const profileText = message.content[0].text;
    const cleanedText = profileText.replace(/```json\
?/g, '').replace(/```\
?/g, '').trim();
    return JSON.parse(cleanedText);
  }

  getSystemPrompt() {
    return `You are a creative music industry professional helping to create fictional band profiles.
Create a complete band profile based on the user's concept.
Be creative, specific, and ensure the band feels authentic and unique.

Provide a response in valid JSON format with this exact structure:
{
  \"bandName\": \"string\",
  \"primaryGenre\": \"string\",
  \"influences\": [\"string\", \"string\", \"string\"],
  \"coreSound\": \"string (2-3 sentences)\",
  \"vocalStyle\": {
    \"type\": \"string (e.g., 'powerful female lead', 'harmonized male/female duet')\",
    \"description\": \"string\"
  },
  \"origin\": \"string (city, country)\",
  \"formationYear\": number,
  \"backstory\": \"string (2-3 sentences)\",
  \"visualIdentity\": {
    \"colors\": \"string\",
    \"aesthetic\": \"string\", 
    \"logo\": \"string (logo concept description)\",
    \"style\": \"string (overall visual style)\"
  },
  \"lyricalThemes\": [\"string\", \"string\", \"string\", \"string\", \"string\"],
  \"albumConcept\": {
    \"title\": \"string\",
    \"description\": \"string (2-3 sentences)\",
    \"themes\": [\"string\", \"string\", \"string\"],
    \"narrative\": \"string (album narrative arc)\"
  },
  \"trackListing\": [
    {
      \"title\": \"string\",
      \"theme\": \"string\",
      \"description\": \"string (50-100 chars)\"
    }
  ],
  \"aiDescription\": \"string (EXACTLY 180-200 characters describing the band's musical style for AI music generation)\",
  \"productionStyle\": \"string (describe production approach)\",
  \"formationStory\": {
    \"howMet\": \"string (how the band members met)\",
    \"earlyDays\": \"string (early days of the band)\",
    \"breakthrough\": \"string (breakthrough moment)\"
  },
  \"visualIdentityStyle\": \"string (overall visual identity approach)\",
  \"bandAiInstructions\": \"string (500-1000 chars - AI instructions for maintaining band's unique voice and style)\",
  \"albumAiInstructions\": \"string (500-1000 chars - AI instructions for this specific album's themes and mood)\"
}

Important requirements:
- Generate 10-12 unique tracks with titles, themes, and descriptions
- AI description must be EXACTLY 180-200 characters for music generation platforms
- Include detailed formation story
- Include production style description
- bandAiInstructions should guide future AI generation to maintain consistency
- albumAiInstructions should be specific to this album's concept
- Ensure all track names are unique and fit the band's and album concept`;
  }

  /**
   * Normalize AI description to be exactly 180-200 characters
   * @param {object} bandProfile
   * @returns {string}
   */
  normalizeAiDescription(bandProfile) {
    if (bandProfile.aiDescription && 
        bandProfile.aiDescription.length >= 180 && 
        bandProfile.aiDescription.length <= 200) {
      return bandProfile.aiDescription;
    }
    
    const baseAiDesc = `${bandProfile.primaryGenre} band with ${bandProfile.vocalStyle.type}. ${bandProfile.coreSound}`;
    
    if (baseAiDesc.length > 200) {
      return baseAiDesc.substring(0, 197) + '...';
    }
    
    if (baseAiDesc.length < 180) {
      return baseAiDesc + ' Creating authentic music with passion and energy.';
    }
    
    return baseAiDesc;
  }
}

export default AnthropicService;
`
}


{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/src/fal.js`,
  `content`: `class FalService {
  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
    this.baseUrl = 'https://fal.run/fal-ai/flux/schnell';
  }

  /**
   * Check if FAL API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Generate image using FAL.ai
   * @param {string} prompt
   * @param {string} imageSize
   * @returns {Promise<string|null>}
   */
  async generateImage(prompt, imageSize = 'square') {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          image_size: imageSize,
          num_images: 1
        })
      });

      const data = await response.json();
      return data?.images?.[0]?.url || null;
    } catch (error) {
      console.error(`FAL.ai generation error: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate all band visuals
   * @param {object} prompts
   * @returns {Promise<object>}
   */
  async generateBandVisuals(prompts) {
    if (!this.isConfigured()) {
      return {
        logoUrl: '',
        albumCoverUrl: '',
        bandPhotoUrl: ''
      };
    }

    const [logoUrl, albumCoverUrl, bandPhotoUrl] = await Promise.all([
      this.generateImage(prompts.logo, 'square'),
      this.generateImage(prompts.albumCover, 'square'),
      this.generateImage(prompts.bandPhoto, 'landscape_16_9')
    ]);

    return {
      logoUrl: logoUrl || '',
      albumCoverUrl: albumCoverUrl || '',
      bandPhotoUrl: bandPhotoUrl || ''
    };
  }
}

export default FalService;
`
}

{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/src/utils.js`,
  `content`: `/**
 * Throws an error if any of the keys are missing from the object
 * @param {*} obj
 * @param {string[]} keys
 * @throws {Error}
 */
export function throwIfMissing(obj, keys) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Generate visual prompts from band profile
 * @param {object} bandProfile
 * @returns {object}
 */
export function generateVisualPrompts(bandProfile) {
  const logoPrompt = `Band logo for \"${bandProfile.bandName}\": ${bandProfile.visualIdentity.logo}. Style: ${bandProfile.visualIdentity.aesthetic}. Colors: ${bandProfile.visualIdentity.colors}. Clean, iconic, suitable for merchandise.`;
  
  const albumCoverPrompt = `Album cover for \"${bandProfile.albumConcept.title}\" by ${bandProfile.bandName}: ${bandProfile.albumConcept.description}. Visual style: ${bandProfile.visualIdentity.aesthetic}. ${bandProfile.primaryGenre} aesthetic.`;
  
  const bandPhotoPrompt = `Professional band photo of ${bandProfile.bandName}: ${bandProfile.backstory}. ${bandProfile.visualIdentity.style} aesthetic. ${bandProfile.vocalStyle.description}.`;
  
  return {
    logo: logoPrompt,
    albumCover: albumCoverPrompt,
    bandPhoto: bandPhotoPrompt
  };
}

/**
 * Get status page HTML
 * @param {string} databaseId
 * @param {string} bandsCollection
 * @returns {string}
 */
export function getStatusPage(databaseId, bandsCollection) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Generate Band Function</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 6px 12px;
          background: #4CAF50;
          color: white;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 30px;
        }
        .section {
          margin: 30px 0;
        }
        .section h3 {
          color: #555;
          margin-bottom: 10px;
        }
        code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
        .code-block {
          background: #f8f8f8;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 10px 0;
          border: 1px solid #e0e0e0;
        }
        ul {
          line-height: 1.8;
        }
        .env-var {
          background: #fff3cd;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 5px 0;
          border-left: 4px solid #ffc107;
        }
        .note {
          background: #e3f2fd;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #2196F3;
        }
      </style>
    </head>
    <body>
      <div class=\"container\">
        <h1>Generate Band Function</h1>
        <div class=\"status\">Active</div>
        
        <div class=\"section\">
          <h3>Overview</h3>
          <p>This function is triggered by Appwrite events when a band document is created with status <code>draft</code>.</p>
          <p>It generates a complete band profile including:</p>
          <ul>
            <li>Band name, genre, and backstory</li>
            <li>Album concept with track listing</li>
            <li>Visual identity and branding</li>
            <li>AI-generated artwork (logo, album cover, band photo)</li>
          </ul>
        </div>
        
        <div class=\"section\">
          <h3>Event Configuration</h3>
          <div class=\"code-block\">
            <code>databases.${databaseId}.collections.${bandsCollection}.documents.*.create</code>
          </div>
        </div>
        
        <div class=\"section\">
          <h3>Required Environment Variables</h3>
          <div class=\"env-var\">
            <strong>ANTHROPIC_API_KEY</strong> - Required for band profile generation
          </div>
          <div class=\"env-var\">
            <strong>FAL_API_KEY</strong> - Optional for image generation
          </div>
        </div>
        
        <div class=\"section\">
          <h3>Function Workflow</h3>
          <ol>
            <li>Receives band creation event with <code>status: 'draft'</code></li>
            <li>Updates status to <code>'generating'</code></li>
            <li>Generates band profile using Anthropic Claude</li>
            <li>Creates album record and song stubs</li>
            <li>Generates visual assets using FAL.ai (if configured)</li>
            <li>Updates band status to <code>'published'</code></li>
          </ol>
        </div>
        
        <div class=\"note\">
          <strong>Note:</strong> This function uses dynamic API keys provided by Appwrite at runtime. 
          Make sure the function has appropriate scopes configured in the Appwrite Console.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get test interface HTML
 * @returns {string}
 */
export function getTestInterface() {
  return `
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
      <meta charset=\"UTF-8\">
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
      <title>Generate Band - Test Interface</title>
      <link rel=\"stylesheet\" href=\"https://unpkg.com/@appwrite.io/pink@0\" />
      <link rel=\"stylesheet\" href=\"https://unpkg.com/@appwrite.io/pink-icons@0\" />
      <script src=\"//unpkg.com/alpinejs\" defer></script>
    </head>
    <body class=\"theme-dark\">
      <main class=\"main-content\">
        <div class=\"top-cover u-padding-block-end-56\">
          <div class=\"container\">
            <h1 class=\"heading-level-1 u-margin-block-start-16\">Generate Band Function</h1>
            <p class=\"body-text-1 u-normal u-margin-block-start-8\" style=\"max-width: 50rem\">
              Use this interface to test the band generation function. Enter a creative prompt
              and the function will generate a complete band profile with AI.
            </p>
          </div>
        </div>
        
        <div x-data=\"bandGenerator()\" class=\"container u-margin-block-start-negative-56\">
          <div class=\"card u-flex u-gap-24 u-flex-vertical\">
            <div>
              <h2 class=\"heading-level-4\">Create a Band</h2>
              <p class=\"text u-margin-block-start-8\">
                Describe the type of band you want to create. Be creative!
              </p>
              
              <div class=\"u-margin-block-start-16\">
                <label class=\"label\">Band Concept</label>
                <textarea 
                  x-model=\"prompt\"
                  class=\"input-text\"
                  rows=\"4\"
                  placeholder=\"Example: Create a synthwave band inspired by 80s sci-fi movies and Japanese city pop...\"
                  :disabled=\"isGenerating\"
                ></textarea>
              </div>
              
              <button 
                @click=\"generateBand()\"
                class=\"button u-margin-block-start-16\"
                :disabled=\"!prompt || isGenerating\"
              >
                <span class=\"text\" x-text=\"isGenerating ? 'Generating...' : 'Generate Band'\"></span>
              </button>
              
              <template x-if=\"error\">
                <div class=\"alert is-danger u-margin-block-start-16\">
                  <div class=\"alert-grid\">
                    <span class=\"icon-x-circle\" aria-hidden=\"true\"></span>
                    <div class=\"alert-content\">
                      <h6 class=\"alert-title\">Error</h6>
                      <p class=\"alert-message\" x-text=\"error\"></p>
                    </div>
                  </div>
                </div>
              </template>
              
              <template x-if=\"result\">
                <div class=\"u-margin-block-start-24\">
                  <h3 class=\"heading-level-5\">Generation Result</h3>
                  <div class=\"card u-margin-block-start-8\" style=\"background: #1a1a1a;\">
                    <pre class=\"u-text-wrap\" style=\"color: #e0e0e0; font-size: 0.875rem;\"><code x-text=\"JSON.stringify(result, null, 2)\"></code></pre>
                  </div>
                  <p class=\"text u-margin-block-start-8\">
                    Band ID: <code class=\"inline-code\" x-text=\"result.bandId\"></code>
                  </p>
                  <p class=\"text u-margin-block-start-4\">
                    Check your Appwrite console to see the created band, album, and songs!
                  </p>
                </div>
              </template>
            </div>
            
            <div class=\"u-sep-block\"></div>
            
            <div>
              <h3 class=\"heading-level-5\">API Usage</h3>
              <p class=\"text u-margin-block-start-8\">
                Send a POST request to this function with the following JSON body:
              </p>
              <div class=\"code-block u-margin-block-start-8\">
                <pre>{
  \"prompt\": \"Your band concept here\",
  \"userId\": \"optional-user-id\"
}</pre>
              </div>
              
              <h4 class=\"heading-level-6 u-margin-block-start-16\">Response</h4>
              <div class=\"code-block u-margin-block-start-8\">
                <pre>{
  \"success\": true,
  \"bandId\": \"generated-band-id\",
  \"bandName\": \"Generated Band Name\",
  \"albumId\": \"generated-album-id\",
  \"albumTitle\": \"Album Title\",
  \"songCount\": 10,
  \"visualAssets\": {
    \"logoUrl\": \"...\",
    \"albumCoverUrl\": \"...\",
    \"bandPhotoUrl\": \"...\"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <script>
        function bandGenerator() {
          return {
            prompt: '',
            isGenerating: false,
            error: null,
            result: null,
            
            async generateBand() {
              this.isGenerating = true;
              this.error = null;
              this.result = null;
              
              try {
                const response = await fetch(window.location.href, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    prompt: this.prompt
                  })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                  throw new Error(data.error || 'Generation failed');
                }
                
                this.result = data;
              } catch (err) {
                this.error = err.message;
              } finally {
                this.isGenerating = false;
              }
            }
          };
        }
      </script>
    </body>
    </html>
  `;
}
`
}

{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/appwrite.json`,
  `content`: `{
  \"projectId\": \"flexos\",
  \"projectName\": \"FlexOS\",
  \"functions\": [
    {
      \"$id\": \"generate-band\",
      \"name\": \"Generate Band\",
      \"runtime\": \"node-18.0\",
      \"entrypoint\": \"src/main.js\",
      \"commands\": \"npm install\",
      \"events\": [],
      \"schedule\": \"\",
      \"timeout\": 300,
      \"enabled\": true,
      \"logging\": true,
      \"execute\": [\"any\"],
      \"vars\": {
        \"APPWRITE_FUNCTION_ENDPOINT\": \"https://fra.cloud.appwrite.io/v1\",
        \"APPWRITE_FUNCTION_PROJECT_ID\": \"flexos\"
      }
    }
  ]
}
`
}

{
  `path`: `/Users/jos/Developer/mitchly-music-generator/appwrite-functions/generate-band/README.md`,
  `content`: `# Generate Band Function

An executable Appwrite function that generates complete fictional band profiles with AI.

## Overview

This function accepts a creative prompt via POST request and generates:
- Complete band profile with backstory
- Album concept with 10-12 track listings
- Visual identity and branding
- AI-generated artwork (logo, album cover, band photo)

## Usage

### Test Interface

Access the function URL via GET request to see the test interface:
```
https://your-function-url.appwrite.global/
```

### API Endpoint

Send a POST request with a JSON body:

```bash
curl -X POST https://your-function-url.appwrite.global/ \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"prompt\": \"Create a synthwave band inspired by 80s sci-fi movies\",
    \"userId\": \"optional-user-id\"
  }'
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Creative description of the band you want to generate |
| userId | string | No | User ID to associate with the band (defaults to 'anonymous') |

### Response

```json
{
  \"success\": true,
  \"bandId\": \"generated-band-id\",
  \"bandName\": \"Neon Dreamscape\",
  \"albumId\": \"generated-album-id\",
  \"albumTitle\": \"Digital Horizons\",
  \"songCount\": 10,
  \"visualAssets\": {
    \"logoUrl\": \"https://...\",
    \"albumCoverUrl\": \"https://...\",
    \"bandPhotoUrl\": \"https://...\"
  },
  \"message\": \"Band generation completed successfully\"
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ANTHROPIC_API_KEY | Yes | Your Anthropic API key for Claude |
| FAL_API_KEY | No | Your FAL.ai API key for image generation |

### Function Settings

- **Runtime**: Node.js 18.0
- **Timeout**: 300 seconds (5 minutes)
- **Execute**: Any (public access)
- **Entry Point**: `src/main.js`

### Required Scopes

The function needs the following Appwrite scopes:
- `databases.write` - To create band, album, and song documents
- `documents.write` - To update documents

## Database Structure

The function expects these collections in the `mitchly-music-db` database:

### Bands Collection
- `userId` (string)
- `bandName` (string)
- `status` (string): 'generating', 'published', 'failed'
- `primaryGenre` (string)
- `profileData` (string): JSON string of full profile
- `origin` (string)
- `formationYear` (integer)
- `aiInstructions` (string)
- `logoPrompt` (string)
- `albumTitle` (string)
- `albumDescription` (string)
- `trackCount` (integer)
- `logoUrl` (string)
- `albumCoverUrl` (string)
- `bandPhotoUrl` (string)
- `userPrompt` (string)
- `generationError` (string)

### Albums Collection
- `bandId` (string)
- `title` (string)
- `description` (string)
- `concept` (string)
- `trackCount` (integer)
- `aiInstructions` (string)
- `status` (string)
- `coverPrompt` (string)
- `coverUrl` (string)

### Songs Collection
- `bandId` (string)
- `albumId` (string)
- `title` (string)
- `trackNumber` (integer)
- `description` (string)
- `lyrics` (string)
- `status` (string)
- `artistDescription` (string)
- `aiInstructions` (string)

## Development

### Local Testing

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export ANTHROPIC_API_KEY=your-key
export FAL_API_KEY=your-key # optional
```

3. Deploy to Appwrite:
```bash
appwrite functions createDeployment \\
  --functionId=generate-band \\
  --entrypoint='src/main.js' \\
  --code=.
```

### Error Handling

The function includes comprehensive error handling:
- Validates required fields
- Updates band status to 'failed' on errors
- Returns descriptive error messages
- Logs detailed error information

## Example Prompts

- \"Create a synthwave band inspired by 80s sci-fi movies and Japanese city pop\"
- \"Generate a folk rock band that combines Celtic mythology with modern environmental themes\"
- \"Design a progressive metal band influenced by classical composers and space exploration\"
- \"Create an indie pop duo that makes music about small town life and coming of age\"
`
}

No problem! Let me recreate the generate-band function as an executable function that accepts POST requests with a text prompt, rather than being triggered by Appwrite events.Now let's update the appwrite.json to remove the event triggers since this will be an executable function:Let's also create a README to document how to use this function:## Summary of Changes

I've recreated the generate-band function as an **executable function** that accepts POST requests with a text prompt, following the Stripe example's patterns:

### Key Features:

1. **Executable via POST Request**
   - Accepts JSON body with `prompt` and optional `userId`
   - No longer triggered by Appwrite events
   - Can be called directly from your frontend

2. **Test Interface**
   - GET request shows a beautiful test UI (like Stripe example)
   - Uses Appwrite's Pink CSS framework
   - Alpine.js for interactivity
   - Live testing of the generation process

3. **Proper Service Architecture**
   - `AppwriteService` - handles database operations
   - `AnthropicService` - handles AI generation
   - `FalService` - handles image generation
   - `utils.js` - shared utilities

4. **Dynamic API Keys**
   - Uses `req.headers['x-appwrite-key']` for Appwrite operations
   - No need to store Appwrite API keys

5. **Better Error Handling**
   - Comprehensive try-catch blocks
   - Updates band status on failure
   - Returns proper HTTP status codes

6. **Complete Workflow**
   - Creates band document immediately
   - Updates status as it progresses
   - Generates profile, album, songs, and visuals
   - Returns comprehensive response

### How to Use:

1. **From Frontend (JavaScript)**:
```javascript
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a punk rock band inspired by The Clash',
    userId: currentUser.$id // optional
  })
});

const result = await response.json();
console.log(result.bandId); // Use this to navigate to the band page
```

2. **From Appwrite SDK**:
```javascript
const execution = await functions.createExecution(
  'generate-band',
  JSON.stringify({ prompt: 'Your prompt here' }),
  false
);
```

3. **Test Interface**:
   - Just visit the function URL in a browser
   - Enter a prompt and click "Generate Band"
   - See the full response

The function is now much more flexible and can be called on-demand rather than waiting for events!