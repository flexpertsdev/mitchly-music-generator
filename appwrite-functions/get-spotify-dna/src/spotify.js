/**
 * Spotify API integration for fetching and analyzing user music data
 */

import { average, countFrequency, sortObjectByValue, unique, percentage } from './utils.js';

/**
 * Fetches comprehensive Spotify user data
 * @param {string} accessToken - Spotify access token
 * @returns {Promise<object>} User's Spotify data
 */
export async function fetchSpotifyUserData(accessToken) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Parallel API calls for efficiency
    const [profile, topTracksShort, topTracksMedium, topTracksLong, recentTracks, topArtists] = await Promise.all([
      fetch('https://api.spotify.com/v1/me', { headers }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', { headers }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50', { headers }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50', { headers }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50', { headers }).then(r => r.json())
    ]);

    // Check for API errors
    if (profile.error || topTracksShort.error) {
      throw new Error(profile.error?.message || topTracksShort.error?.message || 'Spotify API error');
    }

    // Get unique track IDs for audio features
    const allTrackIds = unique([
      ...(topTracksShort.items?.map(t => t.id) || []),
      ...(topTracksMedium.items?.map(t => t.id) || []),
      ...(topTracksLong.items?.map(t => t.id) || [])
    ]).filter(Boolean).slice(0, 100); // Spotify API limit

    // Fetch audio features if we have tracks
    const audioFeatures = allTrackIds.length > 0 
      ? await fetch(`https://api.spotify.com/v1/audio-features?ids=${allTrackIds.join(',')}`, { headers })
          .then(r => r.json())
      : { audio_features: [] };

    return {
      profile,
      topTracks: {
        short: topTracksShort.items || [],
        medium: topTracksMedium.items || [],
        long: topTracksLong.items || []
      },
      recentTracks: recentTracks.items || [],
      topArtists: topArtists.items || [],
      audioFeatures: audioFeatures.audio_features || []
    };

  } catch (err) {
    console.error('Spotify API error:', err);
    const error = new Error(`Failed to fetch Spotify data: ${err.message}`);
    error.status = 502;
    throw error;
  }
}

/**
 * Creates a musical DNA profile from Spotify data
 * @param {object} data - Spotify user data
 * @returns {object} Musical DNA profile
 */
export function createMusicalDNA(data) {
  const { topTracks, topArtists, audioFeatures, recentTracks } = data;
  
  // Combine all tracks for analysis
  const allTracks = [
    ...topTracks.short,
    ...topTracks.medium,
    ...topTracks.long
  ];

  // Extract and analyze genres
  const genres = topArtists.flatMap(artist => artist.genres || []);
  const genreFreq = countFrequency(genres);
  const sortedGenres = sortObjectByValue(genreFreq);

  // Calculate average audio features
  const avgFeatures = calculateAverageFeatures(audioFeatures);

  // Identify patterns and quirks
  const quirks = identifyMusicalQuirks({
    topTracksShort: topTracks.short,
    topTracksMedium: topTracks.medium,
    topTracksLong: topTracks.long,
    topArtists,
    audioFeatures,
    recentTracks
  });

  // Analyze temporal patterns
  const temporalPatterns = analyzeTemporalPatterns(topTracks);

  // Generate AI summary
  const aiSummary = generateAISummary({
    genreFreq,
    avgFeatures,
    quirks,
    temporalPatterns,
    topArtists
  });

  return {
    primaryGenres: sortedGenres.slice(0, 5).map(([genre, count]) => ({
      genre,
      weight: count,
      percentage: percentage(count, genres.length)
    })),
    
    audioProfile: {
      energy: avgFeatures.energy || 0.5,
      valence: avgFeatures.valence || 0.5,
      danceability: avgFeatures.danceability || 0.5,
      acousticness: avgFeatures.acousticness || 0.3,
      instrumentalness: avgFeatures.instrumentalness || 0.1,
      speechiness: avgFeatures.speechiness || 0.1,
      tempo: avgFeatures.tempo || 120,
      loudness: avgFeatures.loudness || -10,
      liveness: avgFeatures.liveness || 0.2
    },
    
    artistInfluences: topArtists.slice(0, 10).map(artist => ({
      name: artist.name,
      genres: artist.genres || [],
      popularity: artist.popularity,
      spotifyUrl: artist.external_urls?.spotify
    })),
    
    topTrackSamples: allTracks.slice(0, 5).map(track => ({
      name: track.name,
      artist: track.artists[0]?.name,
      album: track.album?.name,
      popularity: track.popularity
    })),
    
    quirks,
    temporalPatterns,
    aiSummary,
    
    // Metadata
    analysisDate: new Date().toISOString(),
    dataPoints: {
      tracks: allTracks.length,
      artists: topArtists.length,
      genres: unique(genres).length,
      audioFeatures: audioFeatures.length
    }
  };
}

/**
 * Calculates average audio features
 * @param {Array} audioFeatures - Array of audio feature objects
 * @returns {object} Average features
 */
function calculateAverageFeatures(audioFeatures) {
  if (!audioFeatures || audioFeatures.length === 0) {
    return {};
  }

  const validFeatures = audioFeatures.filter(f => f !== null);
  if (validFeatures.length === 0) {
    return {};
  }

  const features = [
    'energy', 'valence', 'danceability', 'acousticness',
    'instrumentalness', 'speechiness', 'tempo', 'loudness',
    'liveness', 'mode', 'time_signature'
  ];

  const avgFeatures = {};
  features.forEach(feature => {
    const values = validFeatures.map(f => f[feature]).filter(v => v !== null && v !== undefined);
    if (values.length > 0) {
      avgFeatures[feature] = average(values);
    }
  });

  return avgFeatures;
}

/**
 * Identifies musical quirks and patterns
 * @param {object} data - Music data
 * @returns {Array} Quirks array
 */
function identifyMusicalQuirks(data) {
  const quirks = [];
  const { topTracksShort, topTracksLong, audioFeatures, topArtists } = data;

  // Genre exploration
  const recentGenres = new Set(
    topTracksShort.flatMap(t => 
      t.artists.flatMap(a => topArtists.find(ta => ta.id === a.id)?.genres || [])
    )
  );
  const longTermGenres = new Set(
    topTracksLong.flatMap(t => 
      t.artists.flatMap(a => topArtists.find(ta => ta.id === a.id)?.genres || [])
    )
  );
  
  const newGenres = [...recentGenres].filter(g => !longTermGenres.has(g));
  if (newGenres.length > 0) {
    quirks.push({
      type: 'genre_exploration',
      description: 'Recently exploring new genres',
      genres: newGenres.slice(0, 3),
      intensity: 'high'
    });
  }

  // Energy analysis
  const validFeatures = audioFeatures.filter(f => f !== null);
  const recentEnergy = average(validFeatures.slice(0, 20).map(f => f?.energy || 0));
  
  if (recentEnergy > 0.75) {
    quirks.push({
      type: 'high_energy',
      description: 'Prefers high-energy, intense music',
      value: recentEnergy,
      intensity: 'very high'
    });
  } else if (recentEnergy < 0.35) {
    quirks.push({
      type: 'chill_vibes',
      description: 'Gravitates toward calm, relaxed music',
      value: recentEnergy,
      intensity: 'low'
    });
  }

  // Mood consistency
  const valenceValues = validFeatures.map(f => f?.valence || 0);
  const valenceStdDev = standardDeviation(valenceValues);
  
  if (valenceStdDev < 0.15) {
    quirks.push({
      type: 'mood_consistency',
      description: 'Consistent emotional tone in music choices',
      variance: valenceStdDev
    });
  } else if (valenceStdDev > 0.35) {
    quirks.push({
      type: 'mood_variety',
      description: 'Enjoys wide emotional range in music',
      variance: valenceStdDev
    });
  }

  // Instrumental preference
  const avgInstrumental = average(validFeatures.map(f => f?.instrumentalness || 0));
  if (avgInstrumental > 0.5) {
    quirks.push({
      type: 'instrumental_preference',
      description: 'Strong preference for instrumental music',
      value: avgInstrumental
    });
  }

  // Acoustic preference
  const avgAcoustic = average(validFeatures.map(f => f?.acousticness || 0));
  if (avgAcoustic > 0.6) {
    quirks.push({
      type: 'acoustic_preference',
      description: 'Prefers acoustic and organic sounds',
      value: avgAcoustic
    });
  }

  return quirks;
}

/**
 * Analyzes temporal patterns in listening history
 * @param {object} tracks - Top tracks by time period
 * @returns {object} Temporal patterns
 */
function analyzeTemporalPatterns(tracks) {
  const { short, medium, long } = tracks;

  // Calculate consistency across time periods
  const shortArtists = new Set(short.map(t => t.artists[0]?.id).filter(Boolean));
  const mediumArtists = new Set(medium.map(t => t.artists[0]?.id).filter(Boolean));
  const longArtists = new Set(long.map(t => t.artists[0]?.id).filter(Boolean));

  // Artist loyalty
  const shortMediumOverlap = [...shortArtists].filter(a => mediumArtists.has(a)).length;
  const mediumLongOverlap = [...mediumArtists].filter(a => longArtists.has(a)).length;

  const consistency = {
    shortToMedium: percentage(shortMediumOverlap, shortArtists.size),
    mediumToLong: percentage(mediumLongOverlap, mediumArtists.size),
    overall: average([
      percentage(shortMediumOverlap, shortArtists.size),
      percentage(mediumLongOverlap, mediumArtists.size)
    ])
  };

  // Evolution detection
  const isExploring = shortArtists.size > longArtists.size * 1.5;
  const isNarrowing = shortArtists.size < longArtists.size * 0.7;

  // Artist loyalty score
  const artistFrequency = countFrequency([
    ...short.map(t => t.artists[0]?.id),
    ...medium.map(t => t.artists[0]?.id)
  ].filter(Boolean));
  
  const maxArtistCount = Math.max(...Object.values(artistFrequency));
  const loyaltyScore = percentage(maxArtistCount, short.length + medium.length);

  return {
    consistency,
    evolution: {
      exploring: isExploring,
      narrowing: isNarrowing,
      stable: !isExploring && !isNarrowing
    },
    loyaltyScore,
    behavior: isExploring ? 'explorer' : isNarrowing ? 'loyalist' : 'balanced'
  };
}

/**
 * Generates AI-friendly summary
 * @param {object} profile - Musical profile data
 * @returns {object} AI summary
 */
function generateAISummary(profile) {
  const { genreFreq, avgFeatures, quirks, temporalPatterns, topArtists } = profile;
  
  const topGenres = sortObjectByValue(genreFreq)
    .slice(0, 3)
    .map(([genre]) => genre);

  const energyLevel = avgFeatures.energy > 0.7 ? 'high-energy' : 
                     avgFeatures.energy > 0.4 ? 'moderate-energy' : 'low-energy';
  
  const mood = avgFeatures.valence > 0.6 ? 'upbeat and positive' :
               avgFeatures.valence > 0.4 ? 'balanced emotional range' : 'introspective and moody';

  const tempo = avgFeatures.tempo > 140 ? 'fast-paced' :
                avgFeatures.tempo > 100 ? 'moderate tempo' : 'slow and relaxed';

  return {
    primaryGenres: topGenres,
    energyProfile: energyLevel,
    emotionalTone: mood,
    tempoPreference: tempo,
    topInfluences: topArtists.slice(0, 5).map(a => a.name),
    quirks: quirks.map(q => q.description),
    listeningBehavior: temporalPatterns.behavior,
    aiPromptData: {
      genres: topGenres,
      energy: energyLevel,
      mood: mood,
      tempo: tempo,
      influences: topArtists.slice(0, 5).map(a => a.name),
      audioFeatures: {
        danceability: avgFeatures.danceability || 0.5,
        acousticness: avgFeatures.acousticness || 0.3,
        instrumentalness: avgFeatures.instrumentalness || 0.1,
        valence: avgFeatures.valence || 0.5,
        energy: avgFeatures.energy || 0.5
      }
    }
  };
}

/**
 * Calculates standard deviation
 * @param {number[]} values - Array of numbers
 * @returns {number} Standard deviation
 */
function standardDeviation(values) {
  if (!values || values.length === 0) return 0;
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}