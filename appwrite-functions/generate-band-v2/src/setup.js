import { Client, Databases } from 'node-appwrite';

/**
 * Setup script to validate database schema
 * Runs during npm install to ensure all required collections and attributes exist
 */

const DATABASE_ID = 'mitchly-music-db';
const REQUIRED_COLLECTIONS = {
  bands: {
    required: true,
    attributes: [
      'userId', 'bandName', 'status', 'userPrompt', 'createdBy',
      'primaryGenre', 'profileData', 'albumTitle', 'albumDescription',
      'trackCount', 'origin', 'formationYear', 'aiInstructions',
      'logoPrompt', 'bandPhotoPrompt', 'logoUrl', 'imageUrl',
      'albumCoverUrl', 'bandPhotoUrl', 'generationError'
    ]
  },
  albums: {
    required: true,
    attributes: [
      'bandId', 'title', 'description', 'concept', 'trackCount',
      'aiInstructions', 'status', 'coverPrompt', 'releaseYear',
      'userPrompt', 'conceptData', 'coverUrl'
    ]
  },
  songs: {
    required: true,
    attributes: [
      'bandId', 'albumId', 'title', 'trackNumber', 'description',
      'lyrics', 'status', 'artistDescription', 'aiInstructions',
      'audioStatus', 'checkAttempts', 'totalCheckAttempts'
    ]
  }
};

async function validateDatabase() {
  console.log('🔍 Validating database schema...');
  
  // Check for required environment variables
  const requiredEnvVars = [
    'APPWRITE_FUNCTION_ENDPOINT',
    'APPWRITE_FUNCTION_PROJECT_ID',
    'APPWRITE_FUNCTION_API_KEY'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.log('   These will need to be configured in the Appwrite console.');
    return;
  }
  
  try {
    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);
    
    const databases = new Databases(client);
    
    // Check if database exists
    try {
      await databases.get(DATABASE_ID);
      console.log(`✅ Database '${DATABASE_ID}' exists`);
    } catch (error) {
      if (error.code === 404) {
        console.error(`❌ Database '${DATABASE_ID}' does not exist`);
        console.log('   Please create the database in your Appwrite console.');
        process.exit(1);
      }
      throw error;
    }
    
    // Check collections
    for (const [collectionId, config] of Object.entries(REQUIRED_COLLECTIONS)) {
      try {
        const collection = await databases.getCollection(DATABASE_ID, collectionId);
        console.log(`✅ Collection '${collectionId}' exists`);
        
        // Get collection attributes
        const attributes = await databases.listAttributes(DATABASE_ID, collectionId);
        const attributeKeys = attributes.attributes.map(attr => attr.key);
        
        // Check for missing attributes
        const missingAttributes = config.attributes.filter(
          attr => !attributeKeys.includes(attr)
        );
        
        if (missingAttributes.length > 0) {
          console.warn(`⚠️  Collection '${collectionId}' is missing attributes:`);
          missingAttributes.forEach(attr => {
            console.log(`   - ${attr}`);
          });
        }
        
      } catch (error) {
        if (error.code === 404) {
          console.error(`❌ Collection '${collectionId}' does not exist`);
          console.log(`   Required attributes: ${config.attributes.join(', ')}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✨ Database validation complete!');
    console.log('   Note: Ensure you have configured these environment variables in Appwrite:');
    console.log('   - ANTHROPIC_API_KEY (required for AI generation)');
    console.log('   - FAL_API_KEY (optional for image generation)');
    
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    console.log('\n   Please ensure:');
    console.log('   1. The Appwrite endpoint is correct');
    console.log('   2. The project ID is correct');
    console.log('   3. The API key has the necessary permissions');
    process.exit(1);
  }
}

// Run validation if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  validateDatabase().catch(console.error);
}

export default validateDatabase;