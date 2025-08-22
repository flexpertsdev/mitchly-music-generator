/**
 * Hello World Function
 * Simple Appwrite function with modular structure
 */

import { getStaticFile } from './utils.js';

export default async ({ req, res, log, error }) => {
  log('Hello World function executed');
  
  // Handle GET requests - show test page
  if (req.method === 'GET') {
    try {
      const html = getStaticFile('index.html');
      return res.text(html, 200, { 'Content-Type': 'text/html; charset=utf-8' });
    } catch (err) {
      error('Failed to load HTML:', err);
      return res.text('Welcome to Hello World Function! HTML interface not available.', 200);
    }
  }
  
  // Handle POST requests - return JSON
  if (req.method === 'POST') {
    const data = req.bodyJson || {};
    const name = data.name || 'World';
    
    log(`Greeting ${name}`);
    
    return res.json({
      success: true,
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers
    });
  }
  
  // Handle other methods
  return res.json({
    success: false,
    error: 'Method not allowed',
    allowedMethods: ['GET', 'POST']
  }, 405);
};