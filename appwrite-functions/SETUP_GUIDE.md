# Appwrite Functions Complete Setup Guide

## Prerequisites

1. **Install Appwrite CLI**:
```bash
npm install -g appwrite
```

2. **Login to Appwrite**:
```bash
appwrite login
# Enter your email and password
```

3. **Initialize Appwrite in your project**:
```bash
cd /Users/jos/Developer/mitchly-music-generator
appwrite init project
# Select your project or enter project ID: flexos
```

## Function Deployment

### Method 1: Using Appwrite CLI (Recommended)

1. **Deploy the generate-band function**:
```bash
cd appwrite-functions/generate-band

# Create the function
appwrite functions create \
  --functionId="generate-band" \
  --name="Generate Band" \
  --runtime="node-20.0" \
  --execute="any"

# Deploy the code
appwrite deploy function \
  --functionId="generate-band" \
  --entrypoint="src/index.js" \
  --code="." \
  --activate
```

### Method 2: Using Appwrite Console

1. Go to your Appwrite Console: https://cloud.appwrite.io/console/project/flexos
2. Navigate to **Functions** → **Create Function**
3. Configure:
   - **Name**: Generate Band
   - **Function ID**: generate-band
   - **Runtime**: Node.js 20.0
   - **Entrypoint**: src/index.js
4. Upload your function code (zip the generate-band folder)

## Setting Environment Variables

### Via CLI:
```bash
appwrite functions createVariable \
  --functionId="generate-band" \
  --key="APPWRITE_ENDPOINT" \
  --value="https://fra.cloud.appwrite.io/v1"

appwrite functions createVariable \
  --functionId="generate-band" \
  --key="APPWRITE_PROJECT_ID" \
  --value="flexos"

appwrite functions createVariable \
  --functionId="generate-band" \
  --key="APPWRITE_API_KEY" \
  --value="YOUR_API_KEY_HERE"

appwrite functions createVariable \
  --functionId="generate-band" \
  --key="ANTHROPIC_API_KEY" \
  --value="YOUR_ANTHROPIC_KEY_HERE"

appwrite functions createVariable \
  --functionId="generate-band" \
  --key="FAL_API_KEY" \
  --value="YOUR_FAL_KEY_HERE"
```

### Via Console:
1. Go to Functions → Your Function → Settings → Variables
2. Add each environment variable

## Setting up Event Triggers

### Via CLI:
```bash
appwrite functions update \
  --functionId="generate-band" \
  --events="databases.mitchly-music-db.collections.bands.documents.*.create"
```

### Via Console:
1. Go to Functions → Your Function → Settings → Events
2. Add event: `databases.mitchly-music-db.collections.bands.documents.*.create`
3. Save

## Testing the Function

### Method 1: Create a Test Band Document (Recommended)

Create a test file `test-band-creation.js`:

```javascript
import { Client, Databases, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('flexos');

const databases = new Databases(client);

async function testBandGeneration() {
  try {
    console.log('Creating test band...');
    
    const band = await databases.createDocument(
      'mitchly-music-db',
      'bands',
      ID.unique(),
      {
        bandName: 'Temporary',
        primaryGenre: 'Unknown',
        status: 'draft',
        userPrompt: 'Create a psychedelic rock band inspired by Pink Floyd and Tame Impala',
        profileData: '{}',
        origin: '',
        formationYear: 2024,
        albumTitle: '',
        albumDescription: '',
        trackCount: 8
      }
    );
    
    console.log('Band created with ID:', band.$id);
    console.log('Check Appwrite Console → Functions → Executions to see the function run');
    
    // Poll for updates
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedBand = await databases.getDocument(
        'mitchly-music-db',
        'bands',
        band.$id
      );
      
      console.log(`Status: ${updatedBand.status}`);
      
      if (updatedBand.status === 'published') {
        console.log('Band generation complete!');
        console.log('Band Name:', updatedBand.bandName);
        console.log('Logo URL:', updatedBand.logoUrl);
        console.log('Album Cover URL:', updatedBand.albumCoverUrl);
        break;
      } else if (updatedBand.status === 'failed') {
        console.error('Generation failed:', updatedBand.generationError);
        break;
      }
      
      attempts++;
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBandGeneration();
```

Run the test:
```bash
node test-band-creation.js
```

### Method 2: Manual Execution (for debugging)

```bash
appwrite functions createExecution \
  --functionId="generate-band" \
  --body='{
    "$id": "test-band-123",
    "$collection": "bands",
    "status": "draft",
    "userPrompt": "Create a heavy metal band"
  }'
```

### Method 3: Using Appwrite Console

1. Go to Functions → Your Function → Execute
2. Add custom data:
```json
{
  "$id": "test-band-123",
  "$collection": "bands",
  "status": "draft",
  "userPrompt": "Create an indie rock band with environmental themes"
}
```
3. Execute

## Monitoring and Debugging

### View Function Logs:

**CLI**:
```bash
appwrite functions listExecutions --functionId="generate-band"
```

**Console**:
1. Go to Functions → Your Function → Executions
2. Click on any execution to see logs

### Common Issues and Solutions:

1. **Function not triggering**:
   - Check event configuration matches exactly
   - Ensure function is active
   - Check document has `status: 'draft'`

2. **Environment variables not working**:
   - Redeploy function after adding variables
   - Check variable names match exactly

3. **Timeout issues**:
   - Increase function timeout in settings (max 900 seconds)
   - Consider breaking into smaller functions

4. **API errors**:
   - Check API keys are valid
   - Ensure proper permissions on Appwrite API key

## Frontend Integration

Update your Vue component to create bands with the correct status:

```javascript
// BandGenerator.vue
async function generateBand() {
  try {
    isGenerating.value = true;
    
    // Create band with draft status
    const band = await databases.createDocument(
      'mitchly-music-db',
      'bands',
      ID.unique(),
      {
        bandName: 'Generating...', // Temporary name
        primaryGenre: 'Unknown',
        status: 'draft', // This triggers the function!
        userPrompt: userInput.value,
        userId: user.value?.$id || null,
        profileData: '{}',
        origin: '',
        formationYear: new Date().getFullYear(),
        albumTitle: '',
        albumDescription: '',
        trackCount: 8
      }
    );
    
    // Poll for completion
    pollBandStatus(band.$id);
    
  } catch (error) {
    console.error('Error creating band:', error);
    isGenerating.value = false;
  }
}

async function pollBandStatus(bandId) {
  const interval = setInterval(async () => {
    try {
      const band = await databases.getDocument(
        'mitchly-music-db',
        'bands',
        bandId
      );
      
      if (band.status === 'published') {
        clearInterval(interval);
        isGenerating.value = false;
        // Navigate to band page or update UI
        router.push(`/band/${bandId}`);
      } else if (band.status === 'failed') {
        clearInterval(interval);
        isGenerating.value = false;
        showError(band.generationError || 'Generation failed');
      }
    } catch (error) {
      clearInterval(interval);
      isGenerating.value = false;
      showError('Error checking band status');
    }
  }, 2000); // Poll every 2 seconds
}
```

## Production Checklist

- [ ] Deploy all functions
- [ ] Set all environment variables
- [ ] Configure event triggers
- [ ] Test each function
- [ ] Update frontend to use new status-based flow
- [ ] Remove old Netlify functions
- [ ] Set appropriate function timeouts
- [ ] Enable function logging
- [ ] Set up error alerts (