import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const favoriteBands = ref(new Set());
  const favoriteTracks = ref(new Set());
  
  // Load from localStorage on init
  const loadFromStorage = () => {
    try {
      const savedBands = localStorage.getItem('favoriteBands');
      if (savedBands) {
        favoriteBands.value = new Set(JSON.parse(savedBands));
      }
      
      const savedTracks = localStorage.getItem('favoriteTracks');
      if (savedTracks) {
        favoriteTracks.value = new Set(JSON.parse(savedTracks));
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  };
  
  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('favoriteBands', JSON.stringify([...favoriteBands.value]));
      localStorage.setItem('favoriteTracks', JSON.stringify([...favoriteTracks.value]));
    } catch (error) {
      console.error('Error saving favorites to storage:', error);
    }
  };
  
  // Actions for bands
  const toggleBand = (bandId) => {
    if (favoriteBands.value.has(bandId)) {
      favoriteBands.value.delete(bandId);
    } else {
      favoriteBands.value.add(bandId);
    }
    saveToStorage();
    return isBandFavorite(bandId);
  };
  
  const addBand = (bandId) => {
    favoriteBands.value.add(bandId);
    saveToStorage();
  };
  
  const removeBand = (bandId) => {
    favoriteBands.value.delete(bandId);
    saveToStorage();
  };
  
  const isBandFavorite = (bandId) => {
    return favoriteBands.value.has(bandId);
  };
  
  // Actions for tracks
  const toggleTrack = (trackId) => {
    if (favoriteTracks.value.has(trackId)) {
      favoriteTracks.value.delete(trackId);
    } else {
      favoriteTracks.value.add(trackId);
    }
    saveToStorage();
    return isTrackFavorite(trackId);
  };
  
  const addTrack = (trackId) => {
    favoriteTracks.value.add(trackId);
    saveToStorage();
  };
  
  const removeTrack = (trackId) => {
    favoriteTracks.value.delete(trackId);
    saveToStorage();
  };
  
  const isTrackFavorite = (trackId) => {
    return favoriteTracks.value.has(trackId);
  };
  
  // Computed
  const favoriteBandsList = computed(() => [...favoriteBands.value]);
  const favoriteTracksList = computed(() => [...favoriteTracks.value]);
  const favoriteBandsCount = computed(() => favoriteBands.value.size);
  const favoriteTracksCount = computed(() => favoriteTracks.value.size);
  
  // Clear all favorites
  const clearAll = () => {
    favoriteBands.value.clear();
    favoriteTracks.value.clear();
    saveToStorage();
  };
  
  // Initialize on store creation
  loadFromStorage();
  
  return {
    // State
    favoriteBands,
    favoriteTracks,
    
    // Computed
    favoriteBandsList,
    favoriteTracksList,
    favoriteBandsCount,
    favoriteTracksCount,
    
    // Actions - Bands
    toggleBand,
    addBand,
    removeBand,
    isBandFavorite,
    
    // Actions - Tracks
    toggleTrack,
    addTrack,
    removeTrack,
    isTrackFavorite,
    
    // Utility
    clearAll,
    loadFromStorage,
    saveToStorage
  };
});