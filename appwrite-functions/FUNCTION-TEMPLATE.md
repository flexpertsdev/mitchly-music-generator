# 📦 Universal Appwrite Function Template

This template provides a standardized structure for creating Appwrite Functions with consistent documentation, testing interfaces, and deployment processes.

## 📁 Required Directory Structure

```
function-name/
├── src/
│   ├── main.js          # Entry point (REQUIRED)
│   ├── setup.js         # Optional: Database/collection setup script
│   ├── utils.js         # Optional: Utility functions
│   ├── appwrite.js      # Optional: Appwrite client setup
│   └── [service].js     # Optional: Service integrations (stripe.js, anthropic.js, etc.)
├── static/
│   └── index.html       # Test interface (REQUIRED for user-facing functions)
├── package.json         # Node dependencies (REQUIRED - must be at root!)
├── package-lock.json    # Dependency lock file
├── README.md           # Function documentation (REQUIRED)
├── env.d.ts            # TypeScript environment variable definitions
└── .env.example        # Example environment variables

```

## 📋 README.md Template

```markdown
# 🎯 [Function Name]

[Brief one-line description of what this function does]

## 🧰 Usage

### GET /

[If applicable] HTML test interface for interacting with the function.

```
https://your-function-url.appwrite.global/
```

### POST /

[Main endpoint description]

**Parameters**

| Name         | Description                          | Location | Type               | Sample Value                |
| ------------ | ------------------------------------ | -------- | ------------------ | --------------------------- |
| Content-Type | The content type of the request body | Header   | `application/json` | N/A                         |
| [param]      | [Description]                        | Body     | [Type]             | [Sample]                    |

**Request Body**

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Response**

Sample `200` Response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Sample `400` Response:

```json
{
  "success": false,
  "error": "Missing required field: fieldName"
}
```

Sample `500` Response:

```json
{
  "success": false,
  "error": "Internal server error: [details]"
}
```

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                  |
| Build Commands    | `npm install`                  |
| Permissions       | `any`                          |
| Timeout (Seconds) | 15                             |
| Events            | [If triggered by events]       |

## 🔒 Environment Variables

### REQUIRED_API_KEY

[Description of the API key]

| Question      | Answer                         |
| ------------- | ------------------------------ |
| Required      | Yes                            |
| Sample Value  | `sk-...`                       |
| Documentation | [Link to docs]                 |

### OPTIONAL_SETTING

[Description]

| Question     | Answer                          |
| ------------ | ------------------------------- |
| Required     | No                              |
| Default      | `default_value`                 |
| Sample Value | `sample`                        |

### Auto-Injected Variables (Do not set manually)

- `APPWRITE_FUNCTION_API_ENDPOINT` - Appwrite API endpoint
- `APPWRITE_FUNCTION_PROJECT_ID` - Current project ID
- `APPWRITE_FUNCTION_ID` - This function's ID
- `APPWRITE_FUNCTION_API_KEY` - Function API key (when configured)

## 📊 Database Schema

[If applicable, describe collections and fields used]

### Collection Name

| Field       | Type    | Required | Description           | Sample Value |
| ----------- | ------- | -------- | --------------------- | ------------ |
| fieldName   | String  | Yes      | Field description     | `value`      |

## 💻 Integration Examples

### JavaScript (Frontend)

```javascript
// Using fetch
const response = await fetch('https://your-function-url.appwrite.global/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // your data
  })
});

const result = await response.json();

// Using Appwrite SDK
const execution = await functions.createExecution(
  'function-id',
  JSON.stringify({ /* data */ }),
  false
);
```

### cURL

```bash
curl -X POST https://your-function-url.appwrite.global/ \
  -H "Content-Type: application/json" \
  -d '{
    "key": "value"
  }'
```

## 🚨 Error Handling

[Describe error scenarios and how they're handled]

## 📝 Development

### Local Testing

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export API_KEY=your-key
```

3. Run setup (if applicable):
```bash
npm run setup
```

### Deployment

See deployment instructions in FUNCTION-TEMPLATE.md

## 📚 Related Functions

- `related-function-1`: Description
- `related-function-2`: Description
```

## 📄 package.json Template

```json
{
  "name": "function-name",
  "version": "1.0.0",
  "description": "Brief description of the function",
  "main": "src/main.js",
  "type": "module",
  "scripts": {
    "format": "prettier --write .",
    "setup": "node src/setup.js"
  },
  "dependencies": {
    "node-appwrite": "^14.1.0"
  },
  "devDependencies": {
    "prettier": "^3.2.5"
  }
}
```

## 🎨 static/index.html Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Function Name] - Test Interface</title>
  <link rel="stylesheet" href="https://unpkg.com/@appwrite.io/pink@0" />
  <link rel="stylesheet" href="https://unpkg.com/@appwrite.io/pink-icons@0" />
  <script src="//unpkg.com/alpinejs" defer></script>
</head>
<body class="theme-dark">
  <main class="main-content">
    <div class="top-cover u-padding-block-end-56">
      <div class="container">
        <h1 class="heading-level-1 u-margin-block-start-16">[Function Name]</h1>
        <p class="body-text-1 u-normal u-margin-block-start-8" style="max-width: 50rem">
          [Description of what this test interface does]
        </p>
      </div>
    </div>
    
    <div x-data="functionTest()" class="container u-margin-block-start-negative-56">
      <div class="card u-flex u-gap-24 u-flex-vertical">
        <!-- Input Section -->
        <div>
          <h2 class="heading-level-4">Test Function</h2>
          <p class="text u-margin-block-start-8">
            [Instructions for using the test interface]
          </p>
          
          <div class="u-margin-block-start-16">
            <label class="label">Input Field</label>
            <input 
              x-model="inputValue"
              type="text"
              class="input-text"
              placeholder="Enter value..."
              :disabled="isProcessing"
            />
          </div>
          
          <button 
            @click="executeFunction()"
            class="button u-margin-block-start-16"
            :disabled="!inputValue || isProcessing"
          >
            <span class="text" x-text="isProcessing ? 'Processing...' : 'Execute'"></span>
          </button>
          
          <!-- Error Display -->
          <template x-if="error">
            <div class="alert is-danger u-margin-block-start-16">
              <div class="alert-grid">
                <span class="icon-x-circle" aria-hidden="true"></span>
                <div class="alert-content">
                  <h6 class="alert-title">Error</h6>
                  <p class="alert-message" x-text="error"></p>
                </div>
              </div>
            </div>
          </template>
          
          <!-- Success Display -->
          <template x-if="result">
            <div class="u-margin-block-start-24">
              <h3 class="heading-level-5">Result</h3>
              <div class="card u-margin-block-start-8" style="background: #1a1a1a;">
                <pre class="u-text-wrap" style="color: #e0e0e0; font-size: 0.875rem;"><code x-text="JSON.stringify(result, null, 2)"></code></pre>
              </div>
            </div>
          </template>
        </div>
        
        <div class="u-sep-block"></div>
        
        <!-- API Documentation -->
        <div>
          <h3 class="heading-level-5">API Usage</h3>
          <p class="text u-margin-block-start-8">
            Send a POST request to this function with the following JSON body:
          </p>
          <div class="code-block u-margin-block-start-8">
            <pre>{
  "key": "value"
}</pre>
          </div>
          
          <h4 class="heading-level-6 u-margin-block-start-16">Response</h4>
          <div class="code-block u-margin-block-start-8">
            <pre>{
  "success": true,
  "data": {}
}</pre>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <script src="https://cdn.jsdelivr.net/npm/appwrite@12.0.0"></script>
  <script>
    function functionTest() {
      return {
        inputValue: '',
        isProcessing: false,
        result: null,
        error: null,
        
        async executeFunction() {
          this.isProcessing = true;
          this.error = null;
          this.result = null;
          
          try {
            const response = await fetch('/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                // Your request data
                input: this.inputValue
              })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Request failed');
            }
            
            this.result = data;
          } catch (err) {
            this.error = err.message;
          } finally {
            this.isProcessing = false;
          }
        }
      };
    }
  </script>
</body>
</html>
```

## 🔧 src/main.js Template

```javascript
import { throwIfMissing } from './utils.js';

/**
 * Main function handler
 * @param {object} context - Appwrite function context
 * @returns {Promise<object>} Response object
 */
export default async ({ req, res, log, error }) => {
  // Handle GET request - serve test interface
  if (req.method === 'GET') {
    return res.send(
      `<!DOCTYPE html>... [HTML content] ...`,
      200,
      { 'Content-Type': 'text/html' }
    );
  }

  // Handle POST request - main function logic
  if (req.method === 'POST') {
    try {
      // Parse request body
      const body = JSON.parse(req.body || '{}');
      
      // Validate required fields
      throwIfMissing(body, ['requiredField']);
      
      // Your function logic here
      const result = await processRequest(body);
      
      // Return success response
      return res.json({
        success: true,
        data: result,
        message: 'Operation completed successfully'
      });
      
    } catch (err) {
      error(`Error: ${err.message}`);
      
      // Return error response
      return res.json({
        success: false,
        error: err.message || 'Internal server error'
      }, err.status || 500);
    }
  }

  // Method not allowed
  return res.json({
    success: false,
    error: 'Method not allowed'
  }, 405);
};

async function processRequest(data) {
  // Implementation
  return {};
}
```

## 🔧 src/utils.js Template

```javascript
/**
 * Throws an error if any required fields are missing
 * @param {object} obj - Object to check
 * @param {string[]} keys - Required keys
 */
export function throwIfMissing(obj, keys) {
  const missing = [];
  for (const key of keys) {
    if (!(key in obj) || obj[key] === undefined) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Gets environment variable or throws if required
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment value
 */
export function getEnvironmentVariable(key, fallback) {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || fallback;
}

/**
 * Interpolates template variables in HTML
 * @param {string} html - HTML template
 * @param {object} variables - Variables to replace
 * @returns {string} Interpolated HTML
 */
export function interpolate(html, variables) {
  return html.replace(/{{([^}]+)}}/g, (match, key) => {
    return variables[key.trim()] || match;
  });
}
```

## 🔧 src/appwrite.js Template

```javascript
import { Client, Databases, Functions, Storage, Users } from 'node-appwrite';

// Initialize Appwrite client
export function createAppwriteClient(apiKey) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey || process.env.APPWRITE_FUNCTION_API_KEY);

  return {
    client,
    databases: new Databases(client),
    functions: new Functions(client),
    storage: new Storage(client),
    users: new Users(client)
  };
}

// Database configuration
export const DB_CONFIG = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'default',
  COLLECTIONS: {
    ITEMS: process.env.APPWRITE_COLLECTION_ID || 'items'
  }
};
```

## 🔧 env.d.ts Template

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Appwrite auto-injected
      APPWRITE_FUNCTION_API_ENDPOINT: string;
      APPWRITE_FUNCTION_PROJECT_ID: string;
      APPWRITE_FUNCTION_ID: string;
      APPWRITE_FUNCTION_NAME: string;
      APPWRITE_FUNCTION_DEPLOYMENT_ID: string;
      APPWRITE_FUNCTION_PROJECT_NAME: string;
      APPWRITE_FUNCTION_RUNTIME_NAME: string;
      APPWRITE_FUNCTION_RUNTIME_VERSION: string;
      
      // Optional Appwrite
      APPWRITE_FUNCTION_API_KEY?: string;
      APPWRITE_DATABASE_ID?: string;
      APPWRITE_COLLECTION_ID?: string;
      
      // Custom environment variables
      API_KEY?: string;
      // Add your custom variables here
    }
  }
}

export {};
```

## 📦 Deployment Instructions

### 1. Package for Deployment

Create a deployment package with package.json at the root:

```bash
#!/bin/bash
# deploy.sh - Run from function directory

FUNCTION_NAME="your-function-name"

# Ensure we're in the function directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Run from function directory."
  exit 1
fi

# Create tarball with package.json at root
tar -czf "../${FUNCTION_NAME}.tar.gz" \
  package.json \
  package-lock.json \
  src/ \
  static/ \
  README.md \
  env.d.ts

echo "✅ Created ${FUNCTION_NAME}.tar.gz"
echo "📦 Package structure:"
tar -tzf "../${FUNCTION_NAME}.tar.gz" | head -10
```

### 2. Deploy via Appwrite CLI

```bash
# Login to Appwrite
appwrite login

# Create function (first time only)
appwrite functions create \
  --functionId="function-name" \
  --name="Function Name" \
  --runtime="node-18.0"

# Deploy function
appwrite functions createDeployment \
  --functionId="function-name" \
  --entrypoint="src/main.js" \
  --code="./function-name.tar.gz" \
  --activate=true

# Update configuration
appwrite functions update \
  --functionId="function-name" \
  --execute="any" \
  --timeout=30 \
  --events="databases.*.collections.*.documents.*.create"

# Set environment variables
appwrite functions updateVariable \
  --functionId="function-name" \
  --key="API_KEY" \
  --value="your-api-key"
```

### 3. Deploy via Console

1. Navigate to Functions in Appwrite Console
2. Click "Create Function" or select existing
3. Upload the `.tar.gz` file
4. Set configuration:
   - Runtime: Node.js 18.0
   - Entrypoint: `src/main.js`
   - Execute: Any (or specify permissions)
   - Timeout: 15-300 seconds as needed
5. Add environment variables in Variables tab
6. Deploy and activate

## 🏗️ Setup Script Template (src/setup.js)

```javascript
import { createAppwriteClient, DB_CONFIG } from './appwrite.js';

async function setup() {
  console.log('🔧 Setting up database and collections...');
  
  const { databases } = createAppwriteClient();
  
  try {
    // Create database if needed
    try {
      await databases.get(DB_CONFIG.DATABASE_ID);
      console.log('✅ Database exists');
    } catch {
      await databases.create(DB_CONFIG.DATABASE_ID, 'Database Name');
      console.log('✅ Created database');
    }
    
    // Create collections if needed
    try {
      await databases.getCollection(DB_CONFIG.DATABASE_ID, DB_CONFIG.COLLECTIONS.ITEMS);
      console.log('✅ Collection exists');
    } catch {
      await databases.createCollection(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.ITEMS,
        'Items',
        [
          // permissions
        ]
      );
      
      // Create attributes
      await databases.createStringAttribute(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.ITEMS,
        'name',
        255,
        true
      );
      
      console.log('✅ Created collection and attributes');
    }
    
    console.log('✅ Setup completed successfully');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();
```

## 📋 Environment Variable Types

### 1. API Keys (Required Secrets)
```javascript
// Always required, no default
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY is required');
```

### 2. Configuration (Optional with Defaults)
```javascript
// Has sensible default
const timeout = process.env.TIMEOUT || '30';
const maxRetries = process.env.MAX_RETRIES || '3';
```

### 3. Feature Flags (Boolean)
```javascript
// Enable/disable features
const enableCache = process.env.ENABLE_CACHE === 'true';
const debugMode = process.env.DEBUG === 'true';
```

### 4. Auto-Injected (Never Set Manually)
```javascript
// These are automatically provided by Appwrite
const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const functionId = process.env.APPWRITE_FUNCTION_ID;
const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
```

## 🎯 Best Practices

1. **Always include a test interface** (static/index.html) for user-facing functions
2. **Use consistent error response format** with `success: false` and `error` message
3. **Validate all required fields** before processing
4. **Log important events** using the provided `log()` function
5. **Handle both GET and POST** methods appropriately
6. **Include comprehensive README** with all parameters and examples
7. **Use environment variables** for sensitive data and configuration
8. **Test locally** before deploying to production
9. **Version your functions** (e.g., function-v2, function-v3)
10. **Package.json must be at root** of the tar.gz file for deployment

## 🚫 Common Mistakes to Avoid

1. **Wrong package structure** - package.json must be at root, not in a subdirectory
2. **Missing dependencies** - Always include package-lock.json
3. **Hardcoded secrets** - Use environment variables
4. **No error handling** - Always wrap in try/catch
5. **No test interface** - Makes debugging difficult
6. **Incomplete README** - Document all parameters and responses
7. **Wrong entrypoint** - Must match the path in your package
8. **Missing permissions** - Set appropriate execute permissions
9. **Timeout too short** - Consider API call times
10. **No input validation** - Validate before processing

## 📚 Function Types

### 1. Webhook Handler
- Receives external webhooks
- Validates signatures
- Processes and stores data

### 2. API Integration
- Calls external APIs
- Transforms data
- Returns processed results

### 3. Database Trigger
- Triggered by database events
- Processes document changes
- Updates related documents

### 4. Scheduled Function
- Runs on schedule
- Performs batch operations
- Cleanup or maintenance tasks

### 5. User-Facing Function
- Direct user interaction
- Form processing
- Real-time responses

Choose the appropriate template based on your function type!