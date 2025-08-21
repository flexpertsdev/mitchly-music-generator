import { Client, Databases, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('flexos');

const databases = new Databases(client);

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds
const POLL_INTERVAL = 2000; // 2 seconds

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollDocument(databaseId, collectionId, documentId, checkStatus, timeout = TEST_TIMEOUT) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const doc = await databases.getDocument(databaseId, collectionId, documentId);
      log(`Status: ${doc.status}`, 'yellow');
      
      const status = checkStatus(doc);
      if (status.done) {
        return { success: status.success, document: doc };
      }
      
      await sleep(POLL_INTERVAL);
    } catch (error) {
      log(`Error polling document: ${error.message}`, 'red');
      return { success: false, error };
    }
  }
  
  return { success: false, error: 'Timeout waiting for completion' };
}

async function testGenerateBand() {
  log('\n🎸 Testing Band Generation Function', 'bright');
  log('=' .repeat(40), 'bright');
  
  try {
    // Create a band with draft status
    const band = await databases.createDocument(
      'mitchly-music-db',
      'bands',
      ID.unique(),
      {
        bandName: 'Temporary',
        primaryGenre: 'Rock',
        status: 'draft',
        userPrompt: 'Create a progressive rock band inspired by Tool and King Crimson, with complex time signatures and philosophical lyrics',
        profileData: '{}',
        origin: '',
        formationYear: 2024,
        album

Title: '',
        album

Description: '',
        trackCount: 8
      }
    );
    
    log(`✅ Band created with ID: ${band.$id}`, 'green');
    log('Waiting for generation to complete...', 'yellow');
    
    // Poll for completion
    const result = await pollDocument(
      'mitchly-music-db',
      'bands',
      band.$id,
      (doc) => {
        if (doc.status === 'published') return { done: true, success: true };
        if (doc.status === 'failed') return { done: true, success: false };
        return { done: false };
      }
    );
    
    if (result.success) {
      log('✅ Band generation successful!', 'green');
      log(`Band Name: ${result.document.bandName}`, 'blue');
      log(`Genre: ${result.document.primaryGenre}`, 'blue');
      log(`Logo URL: ${result.document.logoUrl}`, 'blue');
      log(`Album Cover: ${result.document.albumCoverUrl}`, 'blue');
      
      // Check if albums and songs were created
      try {
        const albums = await databases.listDocuments(
          'mitchly-music-db',
          'albums',
          [`equal("bandId", "${band.$id}")`]
        );
        log(`Albums created: ${albums.total}`, 'blue');
        
        const songs = await databases.listDocuments(
          'mitchly-music-db',
          'songs',
          [`equal("bandId", "${band.$id}")`]
        );
        log(`Songs created: ${songs.total}`, 'blue');
      } catch (e) {
        log('Could not check albums/songs', 'yellow');
      }
      
      return band.$id;
    } else {
      log('❌ Band generation failed', 'red');
      if (result.document?.generationError) {
        log(`Error: ${result.document.generationError}`, 'red');
      }
      return null;
    }
    
  } catch (error) {
    log(`❌ Error creating band: ${error.message}`, 'red');
    return null;
  }
}

async function testGenerateLyrics(bandId) {
  log('\n🎵 Testing Lyrics Generation Function', 'bright');
  log('=' .repeat(40), 'bright');
  
  if (!bandId) {
    log('No band ID provided, skipping lyrics test', 'yellow');
    return;
  }
  
  try {
    // Get a song from the band
    const songs = await databases.listDocuments(
      'mitchly-music-db',
      'songs',
      [`equal("bandId", "${bandId}")`, `limit(1)`]
    );
    
    if (songs.documents.length === 0) {
      log('No songs found for band', 'yellow');
      return;
    }
    
    const song = songs.documents[0];
    log(`Found song: ${song.title}`, 'blue');
    
    // Update song status to trigger lyrics generation
    await databases.updateDocument(
      'mitchly-music-db',
      'songs',
      song.$id,
      { status: 'generating' }
    );
    
    log('Updated song status to "generating"', 'green');
    log('Waiting for lyrics generation...', 'yellow');
    
    // Poll for completion
    const result = await pollDocument(
      'mitchly-music-db',
      'songs',
      song.$id,
      (doc) => {
        if (doc.status === 'completed' && doc.lyrics) return { done: true, success: true };
        if (doc.status === 'failed') return { done: true, success: false };
        return { done: false };
      }
    );
    
    if (result.success) {
      log('✅ Lyrics generation successful!', 'green');
      log(`Song: ${result.document.title}`, 'blue');
      log(`Description: ${result.document.description}`, 'blue');
      log('Lyrics preview:', 'blue');
      log(result.document.lyrics.substring(0, 200) + '...', 'yellow');
    } else {
      log('❌ Lyrics generation failed', 'red');
      if (result.document?.generationError) {
        log(`Error: ${result.document.generationError}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Error generating lyrics: ${error.message}`, 'red');
  }
}

async function checkFunctionExecutions() {
  log('\n📊 Checking Function Executions', 'bright');
  log('=' .repeat(40), 'bright');
  
  log('Check your Appwrite Console for execution logs:', 'yellow');
  log('https://cloud.appwrite.io/console/project/flexos/functions', 'blue');
  log('\nLook for:', 'yellow');
  log('- generate-band executions', 'yellow');
  log('- generate-lyrics executions', 'yellow');
  log('- Any error logs or failed executions', 'yellow');
}

async function main() {
  log('🚀 Mitchly Music Generator Function Test Suite', 'bright');
  log('=' .repeat(50), 'bright');
  
  log('\nThis test will:', 'yellow');
  log('1. Create a band with draft status (triggers generate-band)', 'yellow');
  log('2. Wait for band generation to complete', 'yellow');
  log('3. Test lyrics generation on a created song', 'yellow');
  log('4. Show you where to check execution logs', 'yellow');
  
  log('\nStarting tests in 3 seconds...', 'yellow');
  await sleep(3000);
  
  // Test band generation
  const bandId = await testGenerateBand();
  
  // Test lyrics generation if band was created
  if (bandId) {
    await sleep(2000);
    await testGenerateLyrics(bandId);
  }
  
  // Show where to check logs
  await checkFunctionExecutions();
  
  log('\n✅ Test suite complete!', 'green');
}

// Run tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
