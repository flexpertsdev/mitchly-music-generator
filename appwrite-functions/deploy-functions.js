#!/usr/bin/env node

/**
 * Deploy all Appwrite functions
 * This script handles the deployment of all functions in the appwrite-functions directory
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const functions = [
  {
    id: 'generate-band',
    name: 'Generate Band',
    entrypoint: 'src/index.js',
    events: ['databases.mitchly-music-db.collections.bands.documents.*.create'],
    envVars: {
      'APPWRITE_ENDPOINT': 'https://fra.cloud.appwrite.io/v1',
      'APPWRITE_PROJECT_ID': 'flexos',
      'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY,
      'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
      'FAL_API_KEY': process.env.FAL_API_KEY
    }
  },
  {
    id: 'generate-lyrics',
    name: 'Generate Lyrics',
    entrypoint: 'src/index.js',
    events: ['databases.mitchly-music-db.collections.songs.documents.*.update'],
    envVars: {
      'APPWRITE_ENDPOINT': 'https://fra.cloud.appwrite.io/v1',
      'APPWRITE_PROJECT_ID': 'flexos',
      'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY,
      'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY
    }
  },
  {
    id: 'generate-audio',
    name: 'Generate Audio',
    entrypoint: 'src/index.js',
    events: ['databases.mitchly-music-db.collections.songs.documents.*.update'],
    envVars: {
      'APPWRITE_ENDPOINT': 'https://fra.cloud.appwrite.io/v1',
      'APPWRITE_PROJECT_ID': 'flexos',
      'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY,
      'MUREKA_API_KEY': process.env.MUREKA_API_KEY
    }
  },
  {
    id: 'poll-audio-status',
    name: 'Poll Audio Status',
    entrypoint: 'src/index.js',
    schedule: '*/5 * * * *', // Every 5 minutes
    envVars: {
      'APPWRITE_ENDPOINT': 'https://fra.cloud.appwrite.io/v1',
      'APPWRITE_PROJECT_ID': 'flexos',
      'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY,
      'MUREKA_API_KEY': process.env.MUREKA_API_KEY
    }
  }
];

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

function execCommand(command, silent = false) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    if (!silent) {
      log(`Error executing: ${command}`, 'red');
      log(error.message, 'red');
    }
    throw error;
  }
}

async function deployFunction(func) {
  log(`\nDeploying ${func.name}...`, 'blue');
  
  const functionPath = path.join(__dirname, 'appwrite-functions', func.id);
  
  try {
    // Check if function exists
    try {
      execCommand(`appwrite functions get --functionId="${func.id}"`, true);
      log(`Function ${func.id} already exists`, 'yellow');
    } catch {
      // Create function if it doesn't exist
      log(`Creating function ${func.id}...`, 'yellow');
      execCommand(`appwrite functions create --functionId="${func.id}" --name="${func.name}" --runtime="node-18.0" --execute="any"`);
    }
    
    // Update function configuration
    log(`Updating function configuration...`, 'yellow');
    
    // Set events or schedule
    if (func.events) {
      const eventsStr = func.events.join(',');
      execCommand(`appwrite functions update --functionId="${func.id}" --events="${eventsStr}" --timeout=900`);
    } else if (func.schedule) {
      execCommand(`appwrite functions update --functionId="${func.id}" --schedule="${func.schedule}" --timeout=900`);
    }
    
    // Set environment variables
    log(`Setting environment variables...`, 'yellow');
    for (const [key, value] of Object.entries(func.envVars)) {
      if (!value) {
        log(`Warning: ${key} is not set. Please set it manually.`, 'yellow');
        continue;
      }
      
      try {
        execCommand(`appwrite functions deleteVariable --functionId="${func.id}" --variableId="${key}"`, true);
      } catch {
        // Variable doesn't exist, that's fine
      }
      
      execCommand(`appwrite functions createVariable --functionId="${func.id}" --key="${key}" --value="${value}"`);
    }
    
    // Deploy code
    log(`Deploying code...`, 'yellow');
    process.chdir(functionPath);
    
    // Install dependencies
    execCommand('npm install');
    
    // Create deployment
    execCommand(`appwrite functions createDeployment --functionId="${func.id}" --entrypoint="${func.entrypoint}" --code="." --activate`);
    
    log(`✅ ${func.name} deployed successfully!`, 'green');
    
  } catch (error) {
    log(`❌ Failed to deploy ${func.name}: ${error.message}`, 'red');
    return false;
  }
  
  return true;
}

async function main() {
  log('🚀 Appwrite Functions Deployment Script', 'bright');
  log('=====================================\n', 'bright');
  
  // Check if Appwrite CLI is logged in
  try {
    execCommand('appwrite account get', true);
  } catch {
    log('Please login to Appwrite CLI first:', 'red');
    log('appwrite login', 'yellow');
    process.exit(1);
  }
  
  // Check for required environment variables
  const requiredEnvVars = ['APPWRITE_API_KEY', 'ANTHROPIC_API_KEY', 'FAL_API_KEY', 'MUREKA_API_KEY'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    log('Missing required environment variables:', 'red');
    missingVars.forEach(v => log(`  - ${v}`, 'yellow'));
    log('\nPlease set them in your .env file or export them:', 'yellow');
    missingVars.forEach(v => log(`  export ${v}="your-key-here"`, 'yellow'));
    process.exit(1);
  }
  
  // Deploy all functions
  let successCount = 0;
  for (const func of functions) {
    if (await deployFunction(func)) {
      successCount++;
    }
  }
  
  log(`\n✅ Deployment complete! ${successCount}/${functions.length} functions deployed.`, 'green');
  
  if (successCount < functions.length) {
    log('Some functions failed to deploy. Please check the errors above.', 'yellow');
  }
  
  // Return to original directory
  process.chdir(__dirname);
}

// Run the deployment
main().catch(error => {
  log(`Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});
