import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { playlistService } from '@/services/appwrite';
import { useAuthStore } from './auth';

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const favoritesPlaylist = ref(null);
  const favoriteBands = ref(new Set());
  const favoriteTracks = ref(new Set());
  const favoriteAlbums = ref(new Set());
  const isInitialized = ref(false);
  const loading = ref(false);
  
  // Get auth store
  const authStore = useAuthStore();
  
  // Initialize favorites from Appwrite
  const initFavorites = async () => {
    if (!authStore.isAuthenticated || isInitialized.value) return;
    
    loading.value = true;
    try {
      // Get or create favorites playlist
      const playlist = await playlistService.getFavoritesPlaylist(authStore.userId);
      favoritesPlaylist.value = playlist;
      
      // Load playlist items
      const items = await playlistService.getPlaylistItems(playlist.$id);
      
      // Clear existing sets
      favoriteBands.value.clear();
      favoriteTracks.value.clear();
      favoriteAlbums.value.clear();
      
      // Populate sets based on item types
      items.forEach(item => {
        if (item.itemType === 'band') {
          favoriteBands.value.add(item.itemId);
        } else if (item.itemType === 'song') {
          favoriteTracks.value.add(item.itemId);
        } else if (item.itemType === 'album') {
          favoriteAlbums.value.add(item.itemId);
        }
      });
      
      // Migrate from localStorage if needed (one-time migration)
      await migrateFromLocalStorage();
      
      isInitialized.value = true;
    } catch (error) {
      console.error('Error initializing favorites:', error);
    } finally {
      loading.value = false;
    }
  };
  
  // Migrate from localStorage (backward compatibility)
  const migrateFromLocalStorage = async () => {
    try {
      const localBands = localStorage.getItem('favoriteBands');
      const localTracks = localStorage.getItem('favoriteTracks');
      let migrated = false;
      
      if (localBands) {
        const bandIds = JSON.parse(localBands);
        for (const bandId of bandIds) {
          if (!favoriteBands.value.has(bandId)) {
            await addBand(bandId);
            migrated = true;
          }
        }
      }
      
      if (localTracks) {
        const trackIds = JSON.parse(localTracks);
        for (const trackId of trackIds) {
          if (!favoriteTracks.value.has(trackId)) {
            await addTrack(trackId);
            migrated = true;
          }
        }
      }
      
      // Clear localStorage after migration
      if (migrated) {
        localStorage.removeItem('favoriteBands');
        localStorage.removeItem('favoriteTracks');
        console.log('Migrated favorites from localStorage to Appwrite');
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  };
  
  // Actions for bands
  const toggleBand = async (bandId) => {
    if (!authStore.isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      return toggleLocalBand(bandId);
    }
    
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      if (favoriteBands.value.has(bandId)) {
        await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, bandId);
        favoriteBands.value.delete(bandId);
        return false;
      } else {
        await playlistService.addToPlaylist(
          favoritesPlaylist.value.$id,
          'band',
          bandId,
          authStore.userId
        );
        favoriteBands.value.add(bandId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling band favorite:', error);
      return isBandFavorite(bandId);
    }
  };
  
  const addBand = async (bandId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.addToPlaylist(
        favoritesPlaylist.value.$id,
        'band',
        bandId,
        authStore.userId
      );
      favoriteBands.value.add(bandId);
    } catch (error) {
      console.error('Error adding band to favorites:', error);
    }
  };
  
  const removeBand = async (bandId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, bandId);
      favoriteBands.value.delete(bandId);
    } catch (error) {
      console.error('Error removing band from favorites:', error);
    }
  };
  
  const isBandFavorite = (bandId) => {
    return favoriteBands.value.has(bandId);
  };
  
  // Actions for tracks
  const toggleTrack = async (trackId) => {
    if (!authStore.isAuthenticated) {
      return toggleLocalTrack(trackId);
    }
    
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      if (favoriteTracks.value.has(trackId)) {
        await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, trackId);
        favoriteTracks.value.delete(trackId);
        return false;
      } else {
        await playlistService.addToPlaylist(
          favoritesPlaylist.value.$id,
          'song',
          trackId,
          authStore.userId
        );
        favoriteTracks.value.add(trackId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling track favorite:', error);
      return isTrackFavorite(trackId);
    }
  };
  
  const addTrack = async (trackId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.addToPlaylist(
        favoritesPlaylist.value.$id,
        'song',
        trackId,
        authStore.userId
      );
      favoriteTracks.value.add(trackId);
    } catch (error) {
      console.error('Error adding track to favorites:', error);
    }
  };
  
  const removeTrack = async (trackId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, trackId);
      favoriteTracks.value.delete(trackId);
    } catch (error) {
      console.error('Error removing track from favorites:', error);
    }
  };
  
  const isTrackFavorite = (trackId) => {
    return favoriteTracks.value.has(trackId);
  };
  
  // Actions for albums
  const toggleAlbum = async (albumId) => {
    if (!authStore.isAuthenticated) {
      return toggleLocalAlbum(albumId);
    }
    
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      if (favoriteAlbums.value.has(albumId)) {
        await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, albumId);
        favoriteAlbums.value.delete(albumId);
        return false;
      } else {
        await playlistService.addToPlaylist(
          favoritesPlaylist.value.$id,
          'album',
          albumId,
          authStore.userId
        );
        favoriteAlbums.value.add(albumId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling album favorite:', error);
      return isAlbumFavorite(albumId);
    }
  };
  
  const addAlbum = async (albumId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.addToPlaylist(
        favoritesPlaylist.value.$id,
        'album',
        albumId,
        authStore.userId
      );
      favoriteAlbums.value.add(albumId);
    } catch (error) {
      console.error('Error adding album to favorites:', error);
    }
  };
  
  const removeAlbum = async (albumId) => {
    if (!authStore.isAuthenticated) return;
    if (!favoritesPlaylist.value) await initFavorites();
    
    try {
      await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, albumId);
      favoriteAlbums.value.delete(albumId);
    } catch (error) {
      console.error('Error removing album from favorites:', error);
    }
  };
  
  const isAlbumFavorite = (albumId) => {
    return favoriteAlbums.value.has(albumId);
  };
  
  // Get full playlist items with data
  const getFavoriteItems = async () => {
    if (!authStore.isAuthenticated || !favoritesPlaylist.value) return [];
    
    try {
      return await playlistService.getPlaylistItems(favoritesPlaylist.value.$id);
    } catch (error) {
      console.error('Error fetching favorite items:', error);
      return [];
    }
  };
  
  // Reorder favorites (for drag and drop)
  const reorderFavorites = async (itemIds) => {
    if (!authStore.isAuthenticated || !favoritesPlaylist.value) return;
    
    try {
      await playlistService.reorderPlaylistItems(favoritesPlaylist.value.$id, itemIds);
    } catch (error) {
      console.error('Error reordering favorites:', error);
    }
  };
  
  // LocalStorage fallback methods for non-authenticated users
  const toggleLocalBand = (bandId) => {
    const localBands = new Set(JSON.parse(localStorage.getItem('favoriteBands') || '[]'));
    if (localBands.has(bandId)) {
      localBands.delete(bandId);
    } else {
      localBands.add(bandId);
    }
    localStorage.setItem('favoriteBands', JSON.stringify([...localBands]));
    favoriteBands.value = localBands;
    return localBands.has(bandId);
  };
  
  const toggleLocalTrack = (trackId) => {
    const localTracks = new Set(JSON.parse(localStorage.getItem('favoriteTracks') || '[]'));
    if (localTracks.has(trackId)) {
      localTracks.delete(trackId);
    } else {
      localTracks.add(trackId);
    }
    localStorage.setItem('favoriteTracks', JSON.stringify([...localTracks]));
    favoriteTracks.value = localTracks;
    return localTracks.has(trackId);
  };
  
  const toggleLocalAlbum = (albumId) => {
    const localAlbums = new Set(JSON.parse(localStorage.getItem('favoriteAlbums') || '[]'));
    if (localAlbums.has(albumId)) {
      localAlbums.delete(albumId);
    } else {
      localAlbums.add(albumId);
    }
    localStorage.setItem('favoriteAlbums', JSON.stringify([...localAlbums]));
    favoriteAlbums.value = localAlbums;
    return localAlbums.has(albumId);
  };
  
  // Load localStorage data for non-authenticated users
  const loadFromStorage = () => {
    if (authStore.isAuthenticated) return;
    
    try {
      const savedBands = localStorage.getItem('favoriteBands');
      if (savedBands) {
        favoriteBands.value = new Set(JSON.parse(savedBands));
      }
      
      const savedTracks = localStorage.getItem('favoriteTracks');
      if (savedTracks) {
        favoriteTracks.value = new Set(JSON.parse(savedTracks));
      }
      
      const savedAlbums = localStorage.getItem('favoriteAlbums');
      if (savedAlbums) {
        favoriteAlbums.value = new Set(JSON.parse(savedAlbums));
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  };
  
  // Computed
  const favoriteBandsList = computed(() => [...favoriteBands.value]);
  const favoriteTracksList = computed(() => [...favoriteTracks.value]);
  const favoriteAlbumsList = computed(() => [...favoriteAlbums.value]);
  const favoriteBandsCount = computed(() => favoriteBands.value.size);
  const favoriteTracksCount = computed(() => favoriteTracks.value.size);
  const favoriteAlbumsCount = computed(() => favoriteAlbums.value.size);
  const totalFavoritesCount = computed(() => 
    favoriteBandsCount.value + favoriteTracksCount.value + favoriteAlbumsCount.value
  );
  
  // Clear all favorites
  const clearAll = async () => {
    if (!authStore.isAuthenticated) {
      localStorage.removeItem('favoriteBands');
      localStorage.removeItem('favoriteTracks');
      localStorage.removeItem('favoriteAlbums');
      favoriteBands.value.clear();
      favoriteTracks.value.clear();
      favoriteAlbums.value.clear();
      return;
    }
    
    if (!favoritesPlaylist.value) return;
    
    try {
      // Get all items and remove them
      const items = await playlistService.getPlaylistItems(favoritesPlaylist.value.$id);
      for (const item of items) {
        await playlistService.removeFromPlaylist(favoritesPlaylist.value.$id, item.itemId);
      }
      
      favoriteBands.value.clear();
      favoriteTracks.value.clear();
      favoriteAlbums.value.clear();
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  };
  
  // Initialize on store creation
  if (authStore.isAuthenticated) {
    initFavorites();
  } else {
    loadFromStorage();
  }
  
  // Watch for auth changes
  authStore.$subscribe(() => {
    if (authStore.isAuthenticated && !isInitialized.value) {
      initFavorites();
    } else if (!authStore.isAuthenticated) {
      isInitialized.value = false;
      loadFromStorage();
    }
  });
  
  return {
    // State
    favoriteBands,
    favoriteTracks,
    favoriteAlbums,
    favoritesPlaylist,
    loading,
    
    // Computed
    favoriteBandsList,
    favoriteTracksList,
    favoriteAlbumsList,
    favoriteBandsCount,
    favoriteTracksCount,
    favoriteAlbumsCount,
    totalFavoritesCount,
    
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
    
    // Actions - Albums
    toggleAlbum,
    addAlbum,
    removeAlbum,
    isAlbumFavorite,
    
    // Utility
    clearAll,
    initFavorites,
    getFavoriteItems,
    reorderFavorites
  };
});