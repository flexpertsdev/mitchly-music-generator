const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  // Parse the request body
  let prompt = '';
  
  try {
    // Parse JSON body
    const body = JSON.parse(req.payload || '{}');
    prompt = body.prompt || 'No prompt provided';
    
    // Log the prompt value
    console.log('Received prompt:', prompt);
    
    // Initialize Appwrite SDK
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);
    
    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY']);
    
    // Create a document in the 'tests' collection
    const document = await databases.createDocument(
      'mitchly-music-db', // Database ID
      'tests', // Collection ID
      sdk.ID.unique(), // Document ID
      {
        prompt: prompt,
        createdAt: new Date().toISOString()
      }
    );
    
    console.log('Document created:', document.$id);
    
    // Return dynamic response
    return res.json({
      success: true,
      message: `Prompt received and processed: "${prompt}"`,
      documentId: document.$id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return res.json({
      success: false,
      error: error.message,
      prompt: prompt || 'Failed to parse prompt'
    }, 500);
  }
};
