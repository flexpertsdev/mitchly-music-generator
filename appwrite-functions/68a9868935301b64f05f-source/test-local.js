// test-local.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// Import the function
import functionHandler from './src/main.js';

// Mock Appwrite context
const mockContext = {
  req: {
    method: 'POST',
    headers: {
      'x-appwrite-key': process.env.TEST_API_KEY || 'test-key',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      songId: 'test-song-123' // Replace with actual song ID
    })
  },
  res: {
    json: (data, statusCode = 200) => {
      console.log(`Response (${statusCode}):`, JSON.stringify(data, null, 2));
      return { data, statusCode };
    },
    text: (data, statusCode = 200) => {
      console.log(`Response (${statusCode}):`, data);
      return { data, statusCode };
    }
  },
  log: (...args) => console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

// Set environment variables for the function
process.env.APPWRITE_FUNCTION_API_ENDPOINT = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
process.env.APPWRITE_FUNCTION_PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID || 'your-project-id';
process.env.MUREKA_API_KEY = process.env.MUREKA_API_KEY || 'your-mureka-api-key';

// Run the function
console.log('Testing Generate Music Function...\n');

functionHandler(mockContext)
  .then(result => {
    console.log('\nFunction completed successfully');
  })
  .catch(err => {
    console.error('\nFunction failed:', err);
  });
