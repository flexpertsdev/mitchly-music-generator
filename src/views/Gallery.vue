<template>
  <div class="gallery min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Mitchly Logo -->
          <router-link to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/ic_launcher-web.png" 
              alt="Mitchly" 
              class="w-10 h-10 rounded-lg"
            />
          </router-link>
          
          <!-- Title -->
          <h1 class="text-2xl md:text-3xl font-bold text-white">
            Band Gallery
          </h1>
          
          <!-- Create Band Button -->
          <router-link 
            to="/"
            class="bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">Create Band</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <!-- Filter Section -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl md:text-2xl font-bold text-white">Band Collection</h2>
        <button
          @click="showMyBandsOnly = !showMyBandsOnly"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all border',
            showMyBandsOnly 
              ? 'bg-mitchly-blue text-white border-mitchly-blue' 
              : 'bg-mitchly-gray text-gray-300 border-gray-700 hover:border-mitchly-blue/50'
          ]"
        >
          <Filter class="w-4 h-4" />
          <span class="hidden sm:inline">{{ showMyBandsOnly ? 'My Bands' : 'All Bands' }}</span>
          <span class="sm:hidden">{{ showMyBandsOnly ? 'Mine' : 'All' }}</span>
        </button>
      </div>

      <!-- Stats Section -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">Total Bands</p>
              <p class="text-2xl font-bold text-white">{{ stats.totalBands }}</p>
            </div>
            <Users class="w-8 h-8 text-mitchly-purple" />
          </div>
        </div>
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">Total Songs</p>
              <p class="text-2xl font-bold text-white">{{ stats.totalSongs }}</p>
            </div>
            <Music class="w-8 h-8 text-mitchly-blue" />
          </div>
        </div>
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">With Audio</p>
              <p class="text-2xl font-bold text-white">{{ stats.songsWithAudio }}</p>
            </div>
            <PlayCircle class="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">Genres</p>
              <p class="text-2xl font-bold text-white">{{ stats.uniqueGenres }}</p>
            </div>
            <Tag class="w-8 h-8 text-mitchly-blue" />
          </div>
        </div>
      </div>


      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <Loader class="w-12 h-12 text-mitchly-blue animate-spin mx-auto" />
          <p class="mt-4 text-gray-400">Loading bands...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="bands.length === 0" class="text-center py-12">
        <Music2 class="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-white mb-2">No bands in the gallery yet</h3>
        <p class="text-gray-400 mb-6">Be the first to create an AI-generated band!</p>
        <router-link
          to="/"
          class="inline-flex items-center gap-2 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <Plus class="w-5 h-5" />
          Create the First Band
        </router-link>
      </div>


      <!-- Bands Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="band in displayBands"
          :key="band.$id"
          class="bg-mitchly-gray rounded-lg border border-gray-800 hover:border-mitchly-blue/30 transition-all duration-300 overflow-hidden group flex flex-col"
        >
          <!-- Band Image -->
          <div class="relative h-48 overflow-hidden bg-gradient-to-br from-mitchly-blue to-mitchly-purple">
            <!-- Use actual band photo if available -->
            <img 
              v-if="band.bandPhotoUrl || band.albumCoverUrl || band.logoUrl"
              :src="band.bandPhotoUrl || band.albumCoverUrl || band.logoUrl"
              :alt="band.bandName"
              class="w-full h-full object-cover"
              @error="handleImageError($event, band)"
            />
            <!-- Fallback to gradient with music icon -->
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <Music class="w-12 h-12 text-white/80" />
            </div>
            <!-- Song count badge -->
            <div v-if="band.songCount > 0" class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {{ band.songCount }} {{ band.songCount === 1 ? 'song' : 'songs' }}
            </div>
          </div>

          <!-- Band Info -->
          <div class="p-4 flex-1 flex flex-col">
            <h3 class="font-bold text-lg text-white mb-1 truncate">{{ band.bandName }}</h3>
            <p class="text-sm text-gray-400 mb-2">{{ band.primaryGenre }}</p>
            
            <!-- Band Description -->
            <p class="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{{ band.backstory || band.coreSound || 'AI-generated band' }}</p>
            
            <!-- Meta Info -->
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span class="flex items-center gap-1">
                <Calendar class="w-3 h-3" />
                {{ band.formationYear }}
              </span>
              <span class="flex items-center gap-1">
                <MapPin class="w-3 h-3" />
                {{ band.origin }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-auto">
              <router-link
                :to="`/band/${band.$id}`"
                class="flex-1 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white font-semibold text-center py-2 rounded-lg transition-colors text-sm"
              >
                View Band
              </router-link>
              <button
                @click="shareBand(band)"
                class="px-3 py-2 bg-mitchly-dark hover:bg-mitchly-light-gray rounded-lg transition-colors border border-gray-700"
                title="Share"
              >
                <Share2 class="w-4 h-4 text-gray-400" />
              </button>
              <button
                v-if="band.isOwner"
                @click="confirmDelete(band)"
                class="px-3 py-2 bg-mitchly-dark hover:bg-red-900/20 rounded-lg transition-colors group/delete border border-gray-700"
                title="Delete"
              >
                <Trash2 class="w-4 h-4 text-gray-400 group-hover/delete:text-red-400" />
              </button>
              <div
                v-else
                class="px-3 py-2 text-gray-600 cursor-not-allowed"
                title="Created by another user"
              >
                <User class="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-8">
        <button
          @click="loadMore"
          class="bg-mitchly-blue hover:bg-mitchly-blue/80 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Load More Bands
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="deleteModal.show = false"
    >
      <div
        class="bg-mitchly-gray rounded-lg max-w-md w-full p-6 border border-gray-800"
        @click.stop
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Delete Band?</h3>
            <p class="text-sm text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        
        <p class="text-gray-300 mb-6">
          Are you sure you want to delete <strong>{{ deleteModal.band?.bandName }}</strong>? 
          This will permanently remove the band and all associated songs.
        </p>

        <div class="flex gap-3">
          <button
            @click="deleteModal.show = false"
            class="flex-1 px-4 py-2 bg-mitchly-dark border border-gray-700 rounded-lg hover:bg-mitchly-light-gray transition-colors text-white"
          >
            Cancel
          </button>
          <button
            @click="deleteBand"
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {{ deleting ? 'Deleting...' : 'Delete Band' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { bandService, songService } from '../services/appwrite';
import {
  Music,
  Music2,
  Users,
  PlayCircle,
  Tag,
  Calendar,
  MapPin,
  Share2,
  Trash2,
  Plus,
  Loader,
  AlertTriangle,
  Filter,
  User
} from 'lucide-vue-next';

const router = useRouter();

// Get or create a user ID (simple implementation for now)
const getUserId = () => {
  let userId = localStorage.getItem('mitchly_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mitchly_user_id', userId);
  }
  return userId;
};

// State
const bands = ref([]);
const songs = ref([]);
const loading = ref(true);
const deleting = ref(false);
const hasMore = ref(false);
const showMyBandsOnly = ref(false);
const currentUserId = getUserId();
const deleteModal = ref({
  show: false,
  band: null
});

// Computed
const stats = computed(() => {
  const bandList = bands.value.map(b => b.profileData || b);
  return {
    totalBands: bands.value.length,
    totalSongs: songs.value.length,
    songsWithAudio: songs.value.filter(s => s.audioUrl).length,
    uniqueGenres: [...new Set(bandList.map(b => b.primaryGenre))].length
  };
});

const displayBands = computed(() => {
  // Filter bands based on My Bands toggle
  let filteredBands = bands.value;
  if (showMyBandsOnly.value) {
    filteredBands = bands.value.filter(band => band.createdBy === currentUserId);
  }
  
  // Map bands with their data and enrich with images
  return filteredBands.map(band => {
    const profile = band.profileData || band;
    const bandSongs = songs.value.filter(s => s.bandId === band.$id);
    
    return {
      ...band,
      ...profile,
      $id: band.$id,
      $createdAt: band.$createdAt,
      createdBy: band.createdBy,
      isOwner: band.createdBy === currentUserId,
      songCount: bandSongs.length,
      hasAudio: bandSongs.some(s => s.audioUrl),
      // Include image URLs from the band data
      bandPhotoUrl: band.bandPhotoUrl || profile.bandPhotoUrl,
      albumCoverUrl: band.albumCoverUrl || profile.albumCoverUrl,
      logoUrl: band.logoUrl || profile.logoUrl
    };
  }).sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
});

// Load data
onMounted(async () => {
  await loadBands();
});

const loadBands = async () => {
  try {
    loading.value = true;
    
    // Load bands from both Appwrite and localStorage
    const [bandResponse, songResponse] = await Promise.all([
      bandService.list({ limit: 100, status: 'published' }), // Only get published bands
      songService.list({ limit: 200 })  // Get all songs
    ]);
    
    // Extract documents array from the response
    bands.value = bandResponse.documents || [];
    songs.value = songResponse.documents || [];
    
    // Check if there are more bands available
    hasMore.value = bandResponse.total > bandResponse.documents.length;
  } catch (error) {
    console.error('Error loading bands:', error);
    // Even if Appwrite fails, we should still get localStorage bands
    try {
      const fallbackBands = await bandService.list({ limit: 100, status: 'published' });
      bands.value = fallbackBands.documents || [];
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      bands.value = [];
    }
    songs.value = [];
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  // This would need pagination support in the service
  // For now, just load all available
  await loadBands();
};

const shareBand = (band) => {
  const url = `${window.location.origin}/band/${band.$id}`;
  const text = `Check out ${band.bandName} - ${band.primaryGenre} band`;
  
  if (navigator.share) {
    navigator.share({
      title: band.bandName,
      text,
      url
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Band link copied to clipboard!');
    });
  }
};

const confirmDelete = (band) => {
  deleteModal.value = {
    show: true,
    band
  };
};

const deleteBand = async () => {
  if (!deleteModal.value.band) return;
  
  deleting.value = true;
  
  try {
    const bandId = deleteModal.value.band.$id;
    
    // Delete all songs associated with the band
    const bandSongs = songs.value.filter(s => s.bandId === bandId);
    for (const song of bandSongs) {
      await songService.delete(song.$id);
    }
    
    // Delete the band
    await bandService.delete(bandId);
    
    // Update local state
    bands.value = bands.value.filter(b => b.$id !== bandId);
    songs.value = songs.value.filter(s => s.bandId !== bandId);
    
    // Close modal
    deleteModal.value = {
      show: false,
      band: null
    };
  } catch (error) {
    console.error('Error deleting band:', error);
    alert('Failed to delete band. Please try again.');
  } finally {
    deleting.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  
  return date.toLocaleDateString();
};

// Handle image loading errors
const handleImageError = (event, band) => {
  // Hide the broken image
  event.target.style.display = 'none';
};
</script>

<style scoped>
.gallery {
  min-height: 100vh;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>