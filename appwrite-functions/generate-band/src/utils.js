/**
 * Helper function to validate required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variables are missing
 */
export function validateEnvironmentVariables(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Helper function to safely parse JSON
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed JSON or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Helper function to validate band profile structure
 * @param {object} profile - Band profile to validate
 * @returns {object} Validation result
 */
export function validateBandProfile(profile) {
  const requiredFields = [
    'bandName',
    'primaryGenre',
    'influences',
    'coreSound',
    'vocalStyle',
    'origin',
    'formationYear',
    'backstory',
    'visualIdentity',
    'lyricalThemes',
    'albumConcept',
    'trackListing',
    'aiDescription',
    'productionStyle'
  ];
  
  const missingFields = requiredFields.filter(field => !profile[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  // Validate track listing
  if (!Array.isArray(profile.trackListing) || profile.trackListing.length < 10) {
    return {
      valid: false,
      errors: 'Track listing must contain at least 10 tracks'
    };
  }
  
  // Validate AI description length
  if (profile.aiDescription.length < 180 || profile.aiDescription.length > 200) {
    return {
      valid: false,
      errors: `AI description must be 180-200 characters (current: ${profile.aiDescription.length})`
    };
  }
  
  return { valid: true };
}

/**
 * Helper function to format error response
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code
 * @returns {object} Formatted error response
 */
export function formatErrorResponse(error, statusCode = 500) {
  return {
    error: true,
    message: error.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {object} Formatted success response
 */
export function formatSuccessResponse(data, message = 'Operation successful') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to sanitize user input
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Helper function to generate unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateUniqueId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Helper function to retry async operations
 * @param {Function} operation - Async operation to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delay - Delay between attempts in milliseconds
 * @returns {Promise<*>} Result of the operation
 */
export async function retryOperation(operation, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
}

/**
 * Helper function to extract database trigger data
 * @param {object} req - Appwrite request object
 * @returns {object} Extracted trigger data
 */
export function extractTriggerData(req) {
  const body = typeof req.body === 'string' 
    ? safeJsonParse(req.body, {}) 
    : req.body;
  
  return {
    documentId: body.$id,
    databaseId: body.$databaseId,
    collectionId: body.$collectionId,
    document: body,
    isUpdate: req.headers['x-appwrite-event']?.includes('update') || false,
    isCreate: req.headers['x-appwrite-event']?.includes('create') || false
  };
}

/**
 * Helper function to log with context
 * @param {Function} log - Appwrite log function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} context - Additional context
 */
export function logWithContext(log, level, message, context = {}) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  log(JSON.stringify(logEntry));
}

/**
 * Generate HTML status page for GET requests
 * @param {string} databaseId 
 * @param {string} collectionId 
 * @returns {string} HTML content
 */
export function getStatusPage(databaseId, collectionId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate Band Function</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .status {
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 30px;
            font-weight: 600;
        }
        .info {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info h3 {
            margin-top: 0;
            color: #667eea;
        }
        code {
            background: #1f2937;
            color: #10b981;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        .trigger-info {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .feature {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .feature strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎸 Generate Band Function</h1>
        <div class="status">✅ Function Active</div>
        
        <div class="info">
            <h3>📋 Function Configuration</h3>
            <p><strong>Database ID:</strong> <code>${databaseId}</code></p>
            <p><strong>Collection ID:</strong> <code>${collectionId}</code></p>
            <p><strong>Runtime:</strong> Node.js 18.0</p>
            <p><strong>Timeout:</strong> 300 seconds</p>
        </div>
        
        <div class="trigger-info">
            <strong>⚡ Trigger Event:</strong><br>
            This function automatically triggers when a document is created in the bands collection.
        </div>
        
        <div class="info">
            <h3>🎯 What This Function Does</h3>
            <div class="features">
                <div class="feature">
                    <strong>Band Profile</strong>
                    Generates complete band identity using AI
                </div>
                <div class="feature">
                    <strong>Album Concept</strong>
                    Creates album with 10-12 unique tracks
                </div>
                <div class="feature">
                    <strong>Visual Assets</strong>
                    Generates band photo and album cover
                </div>
                <div class="feature">
                    <strong>AI Instructions</strong>
                    Provides guidance for consistent content
                </div>
            </div>
        </div>
        
        <div class="info">
            <h3>🔑 Required Environment Variables</h3>
            <ul>
                <li><code>ANTHROPIC_API_KEY</code> - For band profile generation</li>
                <li><code>FAL_API_KEY</code> - For image generation</li>
                <li><code>APPWRITE_FUNCTION_API_KEY</code> - Database access</li>
            </ul>
        </div>
        
        <div class="info">
            <h3>📊 Service Status</h3>
            <p>✅ Anthropic AI Service</p>
            <p>✅ FAL Image Generation</p>
            <p>✅ Appwrite Database</p>
        </div>
    </div>
</body>
</html>`;
}