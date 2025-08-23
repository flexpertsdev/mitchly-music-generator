import AppwriteService from './appwrite.js';
import AnthropicService from './anthropic.js';
import FalService from './fal.js';
import { 
  validateEnvironmentVariables,
  validateBandProfile,
  formatErrorResponse,
  formatSuccessResponse,
  extractTriggerData,
  logWithContext,
  getStatusPage,
  retryOperation
} from './utils.js';

// Database configuration
const DATABASE_ID = 'mitchly-music-db';
const BANDS_COLLECTION = 'bands';

export default async ({ req, res, log, error }) => {
  // Handle GET requests - show status page
  if (req.method === 'GET') {
    const html = getStatusPage(DATABASE_ID, BANDS_COLLECTION);
    return res.text(html, 200, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  // Validate environment variables
  try {
    validateEnvironmentVariables([
      'ANTHROPIC_API_KEY',
      'FAL_API_KEY',
      'APPWRITE_FUNCTION_API_KEY'
    ]);
  } catch (err) {
    error(`Environment validation failed: ${err.message}`);
    return res.json(formatErrorResponse(err, 500));
  }

  // Extract trigger data
  const triggerData = extractTriggerData(req);
  
  if (!triggerData.documentId) {
    error('No document ID found in trigger');
    return res.json(formatErrorResponse(new Error('No document ID found'), 400));
  }

  logWithContext(log, 'info', 'Processing band generation', {
    documentId: triggerData.documentId,
    isUpdate: triggerData.isUpdate,
    isCreate: triggerData.isCreate
  });

  // Initialize services
  let appwrite, anthropic, fal;
  
  try {
    // Use dynamic API key from headers or fall back to env
    const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY;
    appwrite = new AppwriteService(apiKey);
    anthropic = new AnthropicService();
    fal = new FalService();
  } catch (err) {
    error(`Service initialization failed: ${err.message}`);
    return res.json(formatErrorResponse(err, 500));
  }

  try {
    // Get the band document
    const bandDoc = await appwrite.getDocument(
      DATABASE_ID, 
      BANDS_COLLECTION, 
      triggerData.documentId
    );

    // Check if already processed
    if (bandDoc.bandProfile || bandDoc.status === 'completed') {
      log('Band already processed, skipping');
      return res.json(formatSuccessResponse(bandDoc, 'Band already processed'));
    }

    // Update status to processing
    await appwrite.updateDocument(
      DATABASE_ID,
      BANDS_COLLECTION,
      triggerData.documentId,
      { status: 'processing' }
    );

    // Generate band profile with retry logic
    log('Generating band profile...');
    const bandProfile = await retryOperation(async () => {
      const profile = await anthropic.generateBandProfile(bandDoc.userPrompt);
      
      // Normalize AI description
      profile.aiDescription = anthropic.normalizeAiDescription(profile);
      
      // Validate profile structure
      const validation = validateBandProfile(profile);
      if (!validation.valid) {
        throw new Error(`Invalid band profile: ${validation.errors}`);
      }
      
      return profile;
    }, 3, 2000);

    logWithContext(log, 'info', 'Band profile generated', {
      bandName: bandProfile.bandName,
      genre: bandProfile.primaryGenre,
      tracks: bandProfile.trackListing.length
    });

    // Generate images in parallel
    log('Generating visual assets...');
    const [bandImageUrl, albumCoverUrl] = await Promise.all([
      retryOperation(() => fal.generateBandImage(bandProfile), 2, 3000),
      retryOperation(() => fal.generateAlbumCover(bandProfile), 2, 3000)
    ]);

    logWithContext(log, 'info', 'Images generated successfully', {
      bandImage: !!bandImageUrl,
      albumCover: !!albumCoverUrl
    });

    // Prepare final document update
    const updateData = {
      status: 'completed',
      bandProfile: bandProfile,
      bandImageUrl: bandImageUrl,
      albumCoverUrl: albumCoverUrl,
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - new Date(bandDoc.$createdAt).getTime()
    };

    // Update the document with all generated content
    const updatedDoc = await appwrite.updateDocument(
      DATABASE_ID,
      BANDS_COLLECTION,
      triggerData.documentId,
      updateData
    );

    logWithContext(log, 'success', 'Band generation completed', {
      documentId: triggerData.documentId,
      bandName: bandProfile.bandName,
      processingTime: updateData.processingTime
    });

    return res.json(formatSuccessResponse({
      documentId: triggerData.documentId,
      bandName: bandProfile.bandName,
      status: 'completed',
      hasImages: true,
      trackCount: bandProfile.trackListing.length
    }, 'Band generation completed successfully'));

  } catch (err) {
    error(`Band generation failed: ${err.message}`);
    
    // Update document with error status
    try {
      await appwrite.updateDocument(
        DATABASE_ID,
        BANDS_COLLECTION,
        triggerData.documentId,
        {
          status: 'failed',
          error: err.message,
          failedAt: new Date().toISOString()
        }
      );
    } catch (updateErr) {
      error(`Failed to update error status: ${updateErr.message}`);
    }

    return res.json(formatErrorResponse(err));
  }
};