#!/usr/bin/env node

/**
 * Script to verify Appwrite function deployment and configuration
 */

import { Client, Functions, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('flexos')
  .setKey(process.env.APPWRITE_API_KEY || '');

const functions = new Functions(client);
const databases = new Databases(client);

async function checkFunction() {
  try {
    console.log('🔍 Checking generate-band function...\n');
    
    // Get function details
    const func = await functions.get('generate-band');
    console.log('✅ Function found:', func.name);
    console.log('   Status:', func.status);
    console.log('   Runtime:', func.runtime);
    console.log('   Timeout:', func.timeout, 'seconds');
    console.log('   Events:', func.events?.length || 0, 'triggers configured');
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    const vars = func.vars || {};
    const requiredVars = ['APPWRITE_API_KEY', 'ANTHROPIC_API_KEY', 'FAL_API_KEY'];
    
    for (const varName of requiredVars) {
      if (vars[varName]) {
        console.log(`   ✅ ${varName}: Set (${vars[varName].substring(0, 10)}...)`);
      } else {
        console.log(`   ❌ ${varName}: NOT SET - Function will fail!`);
      }
    }
    
    // Get recent executions
    console.log('\n📊 Recent Executions:');
    const executions = await functions.listExecutions('generate-band', [], 5);
    
    if (executions.total === 0) {
      console.log('   No executions found');
    } else {
      for (const exec of executions.executions) {
        console.log(`\n   Execution: ${exec.$id}`);
        console.log(`   Status: ${exec.status}`);
        console.log(`   Duration: ${exec.duration}s`);
        console.log(`   Created: ${new Date(exec.$createdAt).toLocaleString()}`);
        
        if (exec.logs) {
          console.log('   Logs:', exec.logs.substring(0, 200) + '...');
        }
        if (exec.errors) {
          console.log('   ❌ Errors:', exec.errors);
        }
      }
    }
    
    // Check for draft bands that should have triggered
    console.log('\n🎸 Checking for draft bands...');
    const draftBands = await databases.listDocuments(
      'mitchly-music-db',
      'bands',
      [Query.equal('status', 'draft')]
    );
    
    if (draftBands.total > 0) {
      console.log(`   Found ${draftBands.total} draft bands that should trigger the function`);
      for (const band of draftBands.documents) {
        console.log(`   - ${band.$id}: ${band.userPrompt?.substring(0, 50)}...`);
      }
    } else {
      console.log('   No draft bands found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure you have set APPWRITE_API_KEY environment variable');
    console.log('You can get an API key from: Console > Settings > API Keys');
  }
}

// Run the check
checkFunction();