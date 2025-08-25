/**
 * Challenge Service
 * Simple service for the Mitchly Challenge using existing database queries
 */
import { songService, bandService } from './database.js';

export const challengeService = {
  /**
   * Get the two specific songs for the challenge
   */
  async getChallengeSongs() {
    try {
      // The specific song IDs for the challenge
      const songIds = [
        '68a61c7c00003e1ca408', // Toxic Paradise by Velvet Rebellion (human)
        '68aa0b8100301977d1ea'  // Dancehall at Low Tide by Velvet Anchor (AI)
      ];
      
      // Fetch both songs and their band info
      const songPromises = songIds.map(async (songId) => {
        try {
          const song = await songService.get(songId);
          const band = await bandService.get(song.bandId);
          
          return {
            id: song.$id,
            title: song.title,
            bandName: band.bandName || band.profileData?.bandName || 'Unknown Band',
            bandId: band.$id,
            genre: song.primaryGenre || band.primaryGenre || band.profileData?.primaryGenre || 'Unknown Genre',
            audioUrl: song.audioUrl,
            audioStatus: song.audioStatus,
            metadata: {
              year: band.formationYear || band.profileData?.formationYear,
              location: band.origin || band.profileData?.origin,
              description: song.description || band.profileData?.backstory
            }
          };
        } catch (error) {
          console.error(`Error fetching song ${songId}:`, error);
          return null;
        }
      });
      
      const songs = (await Promise.all(songPromises)).filter(song => song !== null);
      
      if (songs.length < 2) {
        throw new Error('Could not load both challenge songs');
      }
      
      // Randomize the order so users don't always get the same A/B
      const shuffledSongs = songs.sort(() => Math.random() - 0.5);
      
      // Find which position the AI song (Velvet Anchor) ended up in
      const aiSongIndex = shuffledSongs.findIndex(song => 
        song.id === '68aa0b8100301977d1ea'
      );
      
      return {
        success: true,
        songs: shuffledSongs,
        challengeId: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        aiSongIndex,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error loading challenge songs:', error);
      
      // Fallback to mock data for development
      return this.getMockChallengeSongs();
    }
  },

  /**
   * Submit challenge result (simple localStorage for now)
   */
  async submitResult(resultData) {
    try {
      // Store result locally for analytics
      const results = JSON.parse(localStorage.getItem('mitchly_challenge_results') || '[]');
      
      const result = {
        ...resultData,
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      results.push(result);
      
      // Keep only last 100 results
      if (results.length > 100) {
        results.splice(0, results.length - 100);
      }
      
      localStorage.setItem('mitchly_challenge_results', JSON.stringify(results));
      
      return {
        success: true,
        resultId: result.id,
        isCorrect: resultData.isCorrect,
        message: resultData.isCorrect ? 
          'Congratulations! You have great ears for music!' : 
          'Good try! The line between human and AI creativity is beautifully blurred.'
      };
      
    } catch (error) {
      console.error('Error submitting challenge result:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get local challenge statistics
   */
  async getStats() {
    try {
      const results = JSON.parse(localStorage.getItem('mitchly_challenge_results') || '[]');
      
      if (results.length === 0) {
        return {
          success: true,
          stats: {
            totalChallenges: 0,
            correctGuesses: 0,
            accuracyRate: 0,
            averageTime: 0
          }
        };
      }
      
      const correctGuesses = results.filter(r => r.isCorrect).length;
      const totalTime = results.reduce((sum, r) => sum + (r.listeningTime || 0), 0);
      
      return {
        success: true,
        stats: {
          totalChallenges: results.length,
          correctGuesses,
          accuracyRate: Math.round((correctGuesses / results.length) * 100),
          averageTime: Math.round(totalTime / results.length)
        }
      };
      
    } catch (error) {
      console.error('Error getting challenge stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Mock data for development/fallback
   */
  getMockChallengeSongs() {
    const songs = [
      {
        id: '68a61c7c00003e1ca408',
        title: 'Toxic Paradise',
        bandName: 'Velvet Rebellion',
        bandId: '68a61c7a0017c5e6057d',
        genre: 'Dark Pop-Rap Fusion',
        audioUrl: null,
        audioStatus: 'completed',
        metadata: {
          year: 2022,
          location: 'Miami, USA',
          description: 'A dark exploration of paradise lost'
        }
      },
      {
        id: '68aa0b8100301977d1ea',
        title: 'Dancehall at Low Tide',
        bandName: 'Velvet Anchor',
        bandId: '68aa0b6500321edac170',
        genre: 'Alternative Folk-Noir',
        audioUrl: null,
        audioStatus: 'completed',
        metadata: {
          year: 2021,
          location: 'Newport, Oregon, USA',
          description: 'Haunting folk-noir ballad with Caribbean percussion'
        }
      }
    ];

    // Randomize order
    const shuffledSongs = songs.sort(() => Math.random() - 0.5);
    
    // Find AI song position
    const aiSongIndex = shuffledSongs.findIndex(song => 
      song.id === '68aa0b8100301977d1ea'
    );

    return {
      success: true,
      songs: shuffledSongs,
      challengeId: `mock_challenge_${Date.now()}`,
      aiSongIndex,
      timestamp: new Date().toISOString()
    };
  }
};
