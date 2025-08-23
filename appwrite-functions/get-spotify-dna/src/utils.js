/**
 * Utility functions for the Get Spotify DNA function
 */

/**
 * Throws an error if any required fields are missing
 * @param {object} obj - Object to check
 * @param {string[]} keys - Required keys
 */
export function throwIfMissing(obj, keys) {
  const missing = [];
  for (const key of keys) {
    if (!(key in obj) || obj[key] === undefined || obj[key] === null || obj[key] === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
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
    const error = new Error(`Missing required environment variable: ${key}`);
    error.status = 500;
    throw error;
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
    return variables[key.trim()] || '';
  });
}

/**
 * Safely parses JSON with error handling
 * @param {string} json - JSON string to parse
 * @param {any} fallback - Fallback value on parse error
 * @returns {any} Parsed object or fallback
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}

/**
 * Chunks an array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array[]} Array of chunks
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Calculates the average of numeric values in an array
 * @param {number[]} values - Array of numbers
 * @returns {number} Average value
 */
export function average(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + (val || 0), 0);
  return sum / values.length;
}

/**
 * Groups array items by a key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {object} Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
}

/**
 * Counts frequency of items in an array
 * @param {Array} array - Array to count
 * @returns {object} Frequency map
 */
export function countFrequency(array) {
  return array.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Sorts object entries by value
 * @param {object} obj - Object to sort
 * @param {boolean} descending - Sort in descending order
 * @returns {Array} Sorted entries
 */
export function sortObjectByValue(obj, descending = true) {
  return Object.entries(obj).sort((a, b) => {
    return descending ? b[1] - a[1] : a[1] - b[1];
  });
}

/**
 * Extracts unique values from array
 * @param {Array} array - Array with potential duplicates
 * @returns {Array} Array of unique values
 */
export function unique(array) {
  return [...new Set(array)];
}

/**
 * Safely accesses nested object properties
 * @param {object} obj - Object to access
 * @param {string} path - Property path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Value at path or default
 */
export function get(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Formats a date to ISO string or returns null
 * @param {Date|string|number} date - Date to format
 * @returns {string|null} ISO date string or null
 */
export function formatDate(date) {
  if (!date) return null;
  try {
    return new Date(date).toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Validates Spotify access token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format
 */
export function isValidSpotifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  // Spotify tokens are typically long base64-like strings
  return token.length > 20 && /^[A-Za-z0-9\-_]+$/.test(token);
}

/**
 * Cleans and validates genre string
 * @param {string} genre - Genre to clean
 * @returns {string} Cleaned genre
 */
export function cleanGenre(genre) {
  if (!genre || typeof genre !== 'string') return '';
  return genre.toLowerCase().trim().replace(/[^a-z0-9\s\-]/g, '');
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage
 */
export function percentage(value, total, decimals = 2) {
  if (!total || total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
}