const crypto = require('crypto');

module.exports = async ({ req, res, log, error }) => {
  try {
    const { redirectUri } = JSON.parse(req.bodyRaw || '{}');
    
    if (!redirectUri) {
      return res.json({
        success: false,
        error: 'Missing redirectUri parameter'
      }, 400);
    }

    // Get Spotify credentials from environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    if (!clientId) {
      error('Missing SPOTIFY_CLIENT_ID environment variable');
      return res.json({
        success: false,
        error: 'Server configuration error'
      }, 500);
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Define scopes we need
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state,
      scope: scopes,
      show_dialog: true
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

    return res.json({
      success: true,
      authUrl,
      state
    });

  } catch (err) {
    error('Error generating Spotify auth URL:', err);
    return res.json({
      success: false,
      error: 'Failed to generate authorization URL'
    }, 500);
  }
};
