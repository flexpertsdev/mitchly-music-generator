<template>
  <div class="gallery min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 shadow-lg">
      <div class="container mx-auto">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Band Gallery</h1>
            <p class="text-purple-100 mt-1">Explore AI-generated bands from the community</p>
          </div>
          <router-link 
            to="/"
            class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Home class="w-5 h-5" />
            Create Band
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <!-- Stats Section -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Bands</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalBands }}</p>
            </div>
            <Users class="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Songs</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalSongs }}</p>
            </div>
            <Music class="w-8 h-8 text-pink-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">With Audio</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.songsWithAudio }}</p>
            </div>
            <PlayCircle class="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Genres</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.uniqueGenres }}</p>
            </div>
            <Tag class="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <!-- Filter and Search -->
      <div class="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search bands by name..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
            </div>
          </div>
          <div class="flex gap-2">
            <select
              v-model="filterGenre"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Genres</option>
              <option v-for="genre in availableGenres" :key="genre" :value="genre">
                {{ genre }}
              </option>
            </select>
            <select
              v-model="sortBy"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="genre">Genre</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <Loader class="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <p class="mt-4 text-gray-600">Loading bands...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBands.length === 0 && !searchQuery && !filterGenre" class="text-center py-12">
        <Music2 class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-800 mb-2">No bands in the gallery yet</h3>
        <p class="text-gray-600 mb-6">Be the first to create an AI-generated band!</p>
        <router-link
          to="/"
          class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus class="w-5 h-5" />
          Create the First Band
        </router-link>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredBands.length === 0" class="text-center py-12">
        <Search class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-800 mb-2">No bands found</h3>
        <p class="text-gray-600">Try adjusting your search or filters</p>
      </div>

      <!-- Bands Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="band in filteredBands"
          :key="band.$id"
          class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
        >
          <!-- Band Header with Gradient -->
          <div class="relative h-32 bg-gradient-to-br from-pink-500 to-purple-600 overflow-hidden">
            <div class="absolute inset-0 opacity-10">
              <div class="absolute inset-0 bg-white/10"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <Music class="w-12 h-12 text-white/80" />
            </div>
            <!-- Song count badge -->
            <div v-if="band.songCount > 0" class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {{ band.songCount }} {{ band.songCount === 1 ? 'song' : 'songs' }}
            </div>
          </div>

          <!-- Band Info -->
          <div class="p-4">
            <h3 class="font-bold text-lg text-gray-800 mb-1">{{ band.bandName }}</h3>
            <p class="text-sm text-gray-600 mb-3">{{ band.primaryGenre }}</p>
            
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
            <div class="flex gap-2">
              <router-link
                :to="`/band/${band.$id}`"
                class="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-lg transition-colors text-sm"
              >
                View Band
              </router-link>
              <button
                @click="shareBand(band)"
                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 class="w-4 h-4 text-gray-600" />
              </button>
              <button
                @click="confirmDelete(band)"
                class="px-3 py-2 bg-gray-100 hover:bg-red-100 rounded-lg transition-colors group/delete"
                title="Delete"
              >
                <Trash2 class="w-4 h-4 text-gray-600 group-hover/delete:text-red-600" />
              </button>
            </div>
          </div>

          <!-- Creation Date -->
          <div class="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
            Created {{ formatDate(band.$createdAt) }}
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-8">
        <button
          @click="loadMore"
          class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
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
        class="bg-white rounded-lg max-w-md w-full p-6"
        @click.stop
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800">Delete Band?</h3>
            <p class="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        
        <p class="text-gray-700 mb-6">
          Are you sure you want to delete <strong>{{ deleteModal.band?.bandName }}</strong>? 
          This will permanently remove the band and all associated songs.
        </p>

        <div class="flex gap-3">
          <button
            @click="deleteModal.show = false"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
  Home,
  Music,
  Music2,
  Users,
  PlayCircle,
  Tag,
  Search,
  Calendar,
  MapPin,
  Share2,
  Trash2,
  Plus,
  Loader,
  AlertTriangle
} from 'lucide-vue-next';

const router = useRouter();

// State
const bands = ref([]);
const songs = ref([]);
const loading = ref(true);
const deleting = ref(false);
const searchQuery = ref('');
const filterGenre = ref('');
const sortBy = ref('newest');
const hasMore = ref(false);
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

const availableGenres = computed(() => {
  const genres = bands.value
    .map(b => (b.profileData || b).primaryGenre)
    .filter(Boolean);
  return [...new Set(genres)].sort();
});

const filteredBands = computed(() => {
  let result = bands.value.map(band => {
    const profile = band.profileData || band;
    const bandSongs = songs.value.filter(s => s.bandId === band.$id);
    
    return {
      ...band,
      ...profile,
      $id: band.$id,
      $createdAt: band.$createdAt,
      songCount: bandSongs.length,
      hasAudio: bandSongs.some(s => s.audioUrl)
    };
  });

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(band => 
      band.bandName?.toLowerCase().includes(query) ||
      band.primaryGenre?.toLowerCase().includes(query) ||
      band.origin?.toLowerCase().includes(query)
    );
  }

  // Apply genre filter
  if (filterGenre.value) {
    result = result.filter(band => band.primaryGenre === filterGenre.value);
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'oldest':
      result.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
      break;
    case 'name':
      result.sort((a, b) => (a.bandName || '').localeCompare(b.bandName || ''));
      break;
    case 'genre':
      result.sort((a, b) => (a.primaryGenre || '').localeCompare(b.primaryGenre || ''));
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
  }

  return result;
});

// Load data
onMounted(async () => {
  await loadBands();
});

const loadBands = async () => {
  try {
    loading.value = true;
    
    // Load all bands
    const [bandList, songList] = await Promise.all([
      bandService.list(100), // Get more bands
      songService.list(200)  // Get all songs
    ]);
    
    bands.value = bandList;
    songs.value = songList;
    
    // Check if there are more bands available
    hasMore.value = bandList.length === 100;
  } catch (error) {
    console.error('Error loading bands:', error);
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
</script>

<style scoped>
.gallery {
  min-height: 100vh;
}
</style>