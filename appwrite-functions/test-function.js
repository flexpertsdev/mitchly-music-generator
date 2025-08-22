#!/usr/bin/env node

/**
 * Test script to verify generate-band function
 * Run this after setting environment variables in Appwrite Console
 */

import { Client, Databases, ID } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('flexos')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function testBandGeneration() {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      console.error('❌ Please set APPWRITE_API_KEY environment variable');
      console.log('   export APPWRITE_API_KEY="your-api-key-here"');
      return;
    }

    console.log('🎸 Creating a test band with status "draft"...\n');
    
    // Create a test band document with draft status
    const band = await databases.createDocument(
      'mitchly-music-db',
      'bands',
      ID.unique(),
      {
        userPrompt: 'Create an indie folk band from Portland with ethereal female vocals and acoustic instruments',
        status: 'draft'
      }
    );
    
    console.log('✅ Band created successfully!');
    console.log('   Band ID:', band.$id);
    console.log('   Status:', band.status);
    console.log('   User Prompt:', band.userPrompt);
    console.log('\n📊 The generate-band function should now be triggered...');
    console.log('   Check the function executions in Appwrite Console:');
    console.log('   https://cloud.appwrite.io/console/project-flexos/functions/function-generate-band/executions');
    console.log('\n⏳ Wait 30-60 seconds, then check the band document:');
    
    // Wait a bit then check the band status
    setTimeout(async () => {
      try {
        const updatedBand = await databases.getDocument(
          'mitchly-music-db',
          'bands',
          band.$id
        );
        
        console.log('\n📋 Band Status Check:');
        console.log('   Status:', updatedBand.status);
        console.log('   Band Name:', updatedBand.bandName || 'Not generated yet');
        console.log('   Primary Genre:', updatedBand.primaryGenre || 'Not generated yet');
        
        if (updatedBand.status === 'published') {
          console.log('\n✅ SUCCESS! Band was generated successfully!');
        } else if (updatedBand.status === 'failed') {
          console.log('\n❌ Generation failed. Check function logs for errors.');
          console.log('   Error:', updatedBand.generationError);
        } else if (updatedBand.status === 'generating') {
          console.log('\n⏳ Still generating... Check again in a minute.');
        } else {
          console.log('\n⚠️  Function may not have triggered. Check:');
          console.log('   1. Function is deployed and active');
          console.log('   2. Environment variables are set in function settings');
          console.log('   3. Function execution logs for errors');
        }
      } catch (checkError) {
        console.error('Error checking band status:', checkError.message);
      }
    }, 30000); // Check after 30 seconds
    
  } catch (error) {
    console.error('❌ Error creating test band:', error.message);
    console.log('\nMake sure you have:');
    console.log('1. Set APPWRITE_API_KEY environment variable locally');
    console.log('2. API key has database read/write permissions');
  }
}

// Run the test
console.log('🔧 Testing Generate Band Function\n');
console.log('Prerequisites:');
console.log('1. Function deployed to Appwrite');
console.log('2. Environment variables set in function settings (not global)');
console.log('3. Function is active\n');

testBandGeneration();