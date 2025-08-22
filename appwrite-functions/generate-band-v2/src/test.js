/**
 * Local test script for the generate-band-v2 function
 * Run with: npm test
 */

import main from './main.js';

// Mock Appwrite request/response objects
const mockReq = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-appwrite-user-id': 'test-user',
    'x-appwrite-key': process.env.APPWRITE_FUNCTION_API_KEY
  },
  bodyJson: {
    prompt: 'Create a synthwave band inspired by 80s sci-fi movies and Japanese city pop',
    userId: 'test-user'
  }
};

const mockRes = {
  json: (data, status = 200) => {
    console.log('\n📦 Response:', { status, data });
    return { status, data };
  },
  text: (html, status = 200, headers = {}) => {
    console.log('\n📄 HTML Response:', { status, length: html.length });
    return { status, html, headers };
  }
};

const mockLog = (...args) => console.log('📝 LOG:', ...args);
const mockError = (...args) => console.error('❌ ERROR:', ...args);

async function runTest() {
  console.log('🧪 Testing generate-band-v2 function...\n');
  
  // Check environment variables
  const requiredVars = ['ANTHROPIC_API_KEY', 'APPWRITE_FUNCTION_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('\n💡 Create a .env file with:');
    missingVars.forEach(v => console.log(`   ${v}=your_key_here`));
    process.exit(1);
  }
  
  // Set Appwrite environment variables if not set
  process.env.APPWRITE_FUNCTION_ENDPOINT = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
  process.env.APPWRITE_FUNCTION_PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID || 'flexos';
  
  console.log('📋 Test Configuration:');
  console.log(`   Endpoint: ${process.env.APPWRITE_FUNCTION_ENDPOINT}`);
  console.log(`   Project: ${process.env.APPWRITE_FUNCTION_PROJECT_ID}`);
  console.log(`   Prompt: ${mockReq.bodyJson.prompt}`);
  console.log();
  
  try {
    console.log('🚀 Executing function...\n');
    const result = await main({
      req: mockReq,
      res: mockRes,
      log: mockLog,
      error: mockError
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Load environment variables from .env if available
import dotenv from 'dotenv';
dotenv.config();

// Run the test
runTest().catch(console.error);