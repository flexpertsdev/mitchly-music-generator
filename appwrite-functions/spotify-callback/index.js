const fetch = require('node-fetch');

module.exports = async ({ req, res, log, error }) => {
  try {
    const { code, state, redirectUri } = JSON.parse(req.bodyRaw || '{}');
    
    if (!code || !redirectUri) {
      return res.json({
        success: false,
        error: 'Missing required parameters'
      }, 400);
    }

    // Get Spotify credentials
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      error('Missing Spotify credentials');
      return res.json({
        success: false,
        error: 'Server configuration error'
      }, 500);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      error('Token exchange failed:', errorData);
      return res.json({
        success: false,
        error: 'Failed to exchange authorization code'
      }, 400);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user data in parallel
    const [userProfile, topArtists, topTracks, recentlyPlayed] = await Promise.all([
      fetchSpotifyData('https://api.spotify.com/v1/me', accessToken),
      fetchSpotifyData('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', accessToken),
      fetchSpotifyData('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', accessToken),
      fetchSpotifyData('https://api.spotify.com/v1/me/player/recently-played?limit=50', accessToken)
    ]);

    // Get audio features for top tracks
    let audioFeatures = null;
    if (topTracks && topTracks.items && topTracks.items.length > 0) {
      const trackIds = topTracks.items.map(track => track.id).join(',');
      const featuresResponse = await fetchSpotifyData(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        accessToken
      );
      
      if (featuresResponse && featuresResponse.audio_features) {
        // Calculate average features
        const features = featuresResponse.audio_features.filter(f => f !== null);
        audioFeatures = {
          danceability: average(features.map(f => f.danceability)),
          energy: average(features.map(f => f.energy)),
          key: Math.round(average(features.map(f => f.key))),
          loudness: average(features.map(f => f.loudness)),
          mode: Math.round(average(features.map(f => f.mode))),
          speechiness: average(features.map(f => f.speechiness)),
          acousticness: average(features.map(f => f.acousticness)),
          instrumentalness: average(features.map(f => f.instrumentalness)),
          liveness: average(features.map(f => f.liveness)),
          valence: average(features.map(f => f.valence)),
          tempo: average(features.map(f => f.tempo))
        };
      }
    }

    // Build response
    const responseData = {
      success: true,
      userProfile: {
        id: userProfile.id,
        display_name: userProfile.display_name,
        email: userProfile.email,
        images: userProfile.images,
        country: userProfile.country,
        product: userProfile.product
      },
      topArtists: topArtists.items || [],
      topTracks: topTracks.items || [],
      recentlyPlayed: recentlyPlayed.items || [],
      audioFeatures: audioFeatures,
      tokenData: {
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token
      }
    };

    log('Successfully fetched Spotify data for user:', userProfile.id);
    return res.json(responseData);

  } catch (err) {
    error('Error processing Spotify callback:', err);
    return res.json({
      success: false,
      error: 'Failed to process Spotify data'
    }, 500);
  }
};

async function fetchSpotifyData(url, accessToken) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching from Spotify:', err);
    return null;
  }
}

function average(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
