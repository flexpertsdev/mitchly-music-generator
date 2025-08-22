import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

class AppwriteFunctionDeployer {
  constructor(projectId, apiKey, endpoint = 'https://cloud.appwrite.io/v1') {
    this.projectId = projectId;
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.functions = [];
  }
  
  /**
   * Load function configuration
   */
  loadFunctionConfig(functionDir) {
    const configPath = join(__dirname, functionDir, 'appwrite.json');
    
    if (!existsSync(configPath)) {
      throw new Error(`No appwrite.json found in ${functionDir}`);
    }
    
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const functionName = Object.keys(config)[0];
    
    return {
      name: functionName,
      path: join(__dirname, functionDir),
      config: config[functionName]
    };
  }
  
  /**
   * Deploy a single function
   */
  async deployFunction(functionInfo) {
    const { name, path, config } = functionInfo;
    
    console.log(`\
🚀 Deploying function: ${name}`);
    console.log(`   Path: ${path}`);
    
    try {
      // Check if function exists
      let functionId;
      try {
        const listCmd = `appwrite functions list --projectId ${this.projectId} --parseOutput --limit 100`;
        const functions = JSON.parse(execSync(listCmd, { encoding: 'utf8' }));
        const existingFunction = functions.functions.find(f => f.name === config.name);
        
        if (existingFunction) {
          functionId = existingFunction.$id;
          console.log(`   Found existing function: ${functionId}`);
          
          // Update function
          const updateCmd = `appwrite functions update \\\\
            --functionId ${functionId} \\\\
            --name \"${config.name}\" \\\\
            --runtime \"${config.runtime}\" \\\\
            --execute ${JSON.stringify(config.execute)} \\\\
            --events ${JSON.stringify(config.events)} \\\\
            --schedule \"${config.schedule}\" \\\\
            --timeout ${config.timeout} \\\\
            --enabled ${config.enabled} \\\\
            --logging ${config.logging} \\\\
            --projectId ${this.projectId}`;
          
          execSync(updateCmd, { stdio: 'inherit' });
        } else {
          // Create new function
          console.log('   Creating new function...');
          const createCmd = `appwrite functions create \\\\
            --functionId \"unique()\" \\\\
            --name \"${config.name}\" \\\\
            --runtime \"${config.runtime}\" \\\\
            --execute ${JSON.stringify(config.execute)} \\\\
            --events ${JSON.stringify(config.events)} \\\\
            --schedule \"${config.schedule}\" \\\\
            --timeout ${config.timeout} \\\\
            --enabled ${config.enabled} \\\\
            --logging ${config.logging} \\\\
            --projectId ${this.projectId} \\\\
            --parseOutput`;
          
          const result = JSON.parse(execSync(createCmd, { encoding: 'utf8' }));
          functionId = result.$id;
          console.log(`   Created function: ${functionId}`);
        }
      } catch (error) {
        console.error('   Error checking/creating function:', error.message);
        throw error;
      }
      
      // Update environment variables from .env file
      console.log('   Updating environment variables...');
      const envVars = {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        MUREKA_API_KEY: process.env.MUREKA_API_KEY,
        DATABASE_ID: 'mitchly-music-db',
        BANDS_COLLECTION: 'bands',
        SONGS_COLLECTION: 'songs',
        RATE_LIMIT_COOLDOWN: '20000',
        INITIAL_DELAY: '30000',
        API_CALL_DELAY: '500'
      };
      
      // Only add vars that this function needs
      const functionVars = {};
      if (name.includes('lyrics')) {
        functionVars.ANTHROPIC_API_KEY = envVars.ANTHROPIC_API_KEY;
      }
      if (name.includes('audio')) {
        functionVars.MUREKA_API_KEY = envVars.MUREKA_API_KEY;
      }
      
      // Add common vars
      Object.assign(functionVars, {
        DATABASE_ID: envVars.DATABASE_ID,
        BANDS_COLLECTION: envVars.BANDS_COLLECTION,
        SONGS_COLLECTION: envVars.SONGS_COLLECTION
      });
      
      if (name.includes('poll')) {
        Object.assign(functionVars, {
          RATE_LIMIT_COOLDOWN: envVars.RATE_LIMIT_COOLDOWN,
          INITIAL_DELAY: envVars.INITIAL_DELAY,
          API_CALL_DELAY: envVars.API_CALL_DELAY
        });
      }
      
      for (const [key, value] of Object.entries(functionVars)) {
        if (!value) {
          console.log(`   Skipping ${key} - no value provided`);
          continue;
        }
        
        try {
          // Try to create the variable
          const createVarCmd = `appwrite functions create-variable \\\\
            --functionId ${functionId} \\\\
            --key \"${key}\" \\\\
            --value \"${value}\" \\\\
            --projectId ${this.projectId}`;
          
          execSync(createVarCmd, { stdio: 'pipe' });
          console.log(`   Created variable: ${key}`);
        } catch (error) {
          // If it exists, update it
          try {
            const updateVarCmd = `appwrite functions update-variable \\\\
              --functionId ${functionId} \\\\
              --key \"${key}\" \\\\
              --value \"${value}\" \\\\
              --projectId ${this.projectId}`;
            
            execSync(updateVarCmd, { stdio: 'pipe' });
            console.log(`   Updated variable: ${key}`);
          } catch (updateError) {
            console.log(`   Failed to create/update variable ${key}: ${updateError.message}`);
          }
        }
      }
      
      // Deploy the code
      console.log('   Deploying code...');
      const deployCmd = `appwrite functions create-deployment \\\\
        --functionId ${functionId} \\\\
        --entrypoint \"${config.entrypoint}\" \\\\
        --commands \"${config.commands}\" \\\\
        --code \"${path}\" \\\\
        --activate true \\\\
        --projectId ${this.projectId} \\\\
        --parseOutput`;
      
      const deployment = JSON.parse(execSync(deployCmd, { encoding: 'utf8' }));
      console.log(`   ✅ Deployment created: ${deployment.$id}`);
      
      // Wait for deployment to be ready
      console.log('   Waiting for deployment to be ready...');
      await this.waitForDeployment(functionId, deployment.$id);
      
      return {
        functionId,
        deploymentId: deployment.$id,
        success: true
      };
      
    } catch (error) {
      console.error(`   ❌ Error deploying ${name}:`, error.message);
      return {
        functionId: null,
        deploymentId: null,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Wait for deployment to be ready
   */
  async waitForDeployment(functionId, deploymentId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const cmd = `appwrite functions get-deployment \\\\
          --functionId ${functionId} \\\\
          --deploymentId ${deploymentId} \\\\
          --projectId ${this.projectId} \\\\
          --parseOutput`;
        
        const deployment = JSON.parse(execSync(cmd, { encoding: 'utf8' }));
        
        if (deployment.status === 'ready') {
          console.log('   ✅ Deployment is ready!');
          return true;
        } else if (deployment.status === 'failed') {
          throw new Error(`Deployment failed: ${deployment.stderr}`);
        }
        
        console.log(`   Status: ${deployment.status}... (attempt ${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('   Error checking deployment status:', error.message);
      }
    }
    
    throw new Error('Deployment timeout');
  }
  
  /**
   * Deploy all functions
   */
  async deployAll(functionDirs) {
    console.log('🚀 Starting Appwrite Functions Deployment');
    console.log(`   Project ID: ${this.projectId}`);
    console.log(`   Endpoint: ${`
}