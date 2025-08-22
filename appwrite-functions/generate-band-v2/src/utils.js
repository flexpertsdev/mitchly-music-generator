import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Generate visual prompts from band profile
 * @param {object} bandProfile
 * @returns {object}
 */
export function generateVisualPrompts(bandProfile) {
  const logoPrompt = `Band logo for "${bandProfile.bandName}": ${bandProfile.visualIdentity.logo}. Style: ${bandProfile.visualIdentity.aesthetic}. Colors: ${bandProfile.visualIdentity.colors}. Clean, iconic, suitable for merchandise.`;
  
  const albumCoverPrompt = `Album cover for "${bandProfile.albumConcept.title}" by ${bandProfile.bandName}: ${bandProfile.albumConcept.description}. Visual style: ${bandProfile.visualIdentity.aesthetic}. ${bandProfile.primaryGenre} aesthetic.`;
  
  const bandPhotoPrompt = `Professional band photo of ${bandProfile.bandName}: ${bandProfile.backstory}. ${bandProfile.visualIdentity.style} aesthetic. ${bandProfile.vocalStyle.description}.`;
  
  return {
    logo: logoPrompt,
    albumCover: albumCoverPrompt,
    bandPhoto: bandPhotoPrompt
  };
}

/**
 * Returns the contents of a file in the static folder
 * @param {string} fileName
 * @returns {string}
 */
export function getStaticFile(fileName) {
  const basePath = process.env.APPWRITE_FUNCTION_PROJECT_ID 
    ? '/usr/code-start/static' 
    : path.join(__dirname, '..', 'static');
  const filePath = path.join(basePath, fileName);
  return fs.readFileSync(filePath, 'utf-8');
}