import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Throws an error if any of the keys are missing from the object
 * @param {*} obj
 * @param {string[]} keys
 * @throws {Error}
 */
export function throwIfMissing(obj, keys) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns the contents of a file in the static folder
 * @param {string} fileName
 * @returns {string} Contents of static/{fileName}
 */
export function getStaticFile(fileName) {
  // Try multiple possible paths for Appwrite environment
  const possiblePaths = [
    path.join(__dirname, '..', 'static', fileName),  // Local path (works in Appwrite)
    path.join('/usr/code-start', 'static', fileName), // Appwrite path 1
    path.join('/usr/local/server', 'static', fileName), // Appwrite path 2
    path.join(process.cwd(), 'static', fileName), // Current working directory
  ];
  
  for (const filePath of possiblePaths) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      // Try next path
      continue;
    }
  }
  
  console.error(`Failed to find file ${fileName} in any of the expected paths`);
  throw new Error(`File ${fileName} not found`);
}
