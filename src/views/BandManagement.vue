<template>
  <div class="min-h-screen bg-mitchly-dark">
    <!-- Header with Actions -->
    <AppHeader pageTitle="Band Management">
      <template #actions>
        <div class="flex items-center justify-between gap-4">
          <!-- View Toggle -->
          <div class="flex items-center gap-2">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' 
                  ? 'bg-mitchly-gray text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-mitchly-gray/30'
              ]"
            >
              <Grid3x3 class="w-5 h-5" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded-lg transition-all',
                viewMode === 'list' 
                  ? 'bg-mitchly-gray text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-mitchly-gray/30'
              ]"
            >
              <List class="w-5 h-5" />
            </button>
          </div>

          <!-- Create New Button -->
          <router-link 
            to="/create"
            class="bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus class="w-5 h-5" />
            <span>Create New</span>
          </router-link>
        </div>
      </template>
    </AppHeader>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">My Bands</p>
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
            <PlayCircle class="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">Storage Used</p>
              <p class="text-2xl font-bold text-white">{{ formatBytes(stats.storageUsed) }}</p>
            </div>
            <HardDrive class="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader class="w-8 h-8 text-mitchly-blue animate-spin" />
      </div>

      <!-- Empty State -->
      <div v-else-if="myBands.length === 0" class="text-center py-20">
        <Music class="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-white mb-2">No Bands Yet</h3>
        <p class="text-gray-400 mb-6">You haven't created any bands yet.</p>
        <router-link 
          to="/"
          class="inline-flex items-center gap-2 bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-6 py-3 rounded-lg transition-all"
        >
          <Plus class="w-5 h-5" />
          Create Your First Band
        </router-link>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="band in myBands" 
          :key="band.$id"
          class="bg-mitchly-gray rounded-lg overflow-hidden border border-gray-800 hover:border-mitchly-blue/50 transition-all"
        >
          <!-- Band Image -->
          <div class="aspect-video relative bg-gradient-to-br from-mitchly-purple to-mitchly-blue">
            <img 
              v-if="band.albumCoverUrl" 
              :src="band.albumCoverUrl" 
              :alt="band.bandName"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <Music class="w-12 h-12 text-white/80" />
            </div>
            <!-- Status Badge -->
            <div class="absolute top-2 right-2">
              <span 
                :class="[
                  'text-xs px-2 py-1 rounded-full',
                  band.status === 'published' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : band.status === 'generating'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                ]"
              >
                {{ band.status }}
              </span>
            </div>
          </div>

          <!-- Band Info -->
          <div class="p-4">
            <h3 class="font-bold text-lg text-white mb-1">{{ band.bandName }}</h3>
            <p class="text-sm text-gray-400 mb-4">{{ band.primaryGenre }}</p>
            
            <!-- Band Stats -->
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span class="flex items-center gap-1">
                <Music2 class="w-3 h-3" />
                {{ band.songCount || 0 }} songs
              </span>
              <span class="flex items-center gap-1">
                <Calendar class="w-3 h-3" />
                {{ formatDate(band.$createdAt) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <router-link
                :to="`/band/${band.$id}`"
                class="flex-1 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white text-center py-2 rounded-lg transition-colors text-sm"
              >
                View
              </router-link>
              <button
                @click="editBand(band)"
                class="flex-1 bg-mitchly-dark hover:bg-mitchly-light-gray text-white py-2 rounded-lg transition-colors text-sm border border-gray-700"
              >
                Edit
              </button>
              <button
                @click="confirmDelete(band)"
                class="px-3 py-2 bg-mitchly-dark hover:bg-red-600/20 rounded-lg transition-colors border border-gray-700 hover:border-red-600/50"
                title="Delete"
              >
                <Trash2 class="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-2">
        <div 
          v-for="band in myBands" 
          :key="band.$id"
          class="bg-mitchly-gray rounded-lg p-4 border border-gray-800 hover:border-mitchly-blue/50 transition-all"
        >
          <div class="flex items-center gap-4">
            <!-- Band Image -->
            <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-mitchly-purple to-mitchly-blue flex-shrink-0">
              <img 
                v-if="band.albumCoverUrl" 
                :src="band.albumCoverUrl" 
                :alt="band.bandName"
                class="w-full h-full object-cover rounded-lg"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Music class="w-8 h-8 text-white/80" />
              </div>
            </div>

            <!-- Band Info -->
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-bold text-white">{{ band.bandName }}</h3>
                  <p class="text-sm text-gray-400">{{ band.primaryGenre }}</p>
                </div>
                <span 
                  :class="[
                    'text-xs px-2 py-1 rounded-full',
                    band.status === 'published' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : band.status === 'generating'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  ]"
                >
                  {{ band.status }}
                </span>
              </div>
              
              <!-- Stats -->
              <div class="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span class="flex items-center gap-1">
                  <Music2 class="w-3 h-3" />
                  {{ band.songCount || 0 }} songs
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  Created {{ formatDate(band.$createdAt) }}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  Updated {{ formatDate(band.$updatedAt) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <router-link
                :to="`/band/${band.$id}`"
                class="p-2 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white rounded-lg transition-colors"
                title="View"
              >
                <Eye class="w-4 h-4" />
              </router-link>
              <button
                @click="editBand(band)"
                class="p-2 bg-mitchly-dark hover:bg-mitchly-light-gray text-white rounded-lg transition-colors border border-gray-700"
                title="Edit"
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                @click="confirmDelete(band)"
                class="p-2 bg-mitchly-dark hover:bg-red-600/20 rounded-lg transition-colors border border-gray-700 hover:border-red-600/50"
                title="Delete"
              >
                <Trash2 class="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
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
          This will permanently remove the band and all {{ deleteModal.band?.songCount || 0 }} associated songs.
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
import { bandService, songService } from '@/services/appwrite';
import { useAuthStore } from '@/stores/auth';
import AppHeader from '@/components/navigation/AppHeader.vue';
import {
  Users,
  Music,
  Music2,
  PlayCircle,
  HardDrive,
  Plus,
  Grid3x3,
  List,
  Loader,
  Calendar,
  Clock,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(true);
const deleting = ref(false);
const viewMode = ref('grid'); // 'grid' or 'list'
const myBands = ref([]);
const deleteModal = ref({
  show: false,
  band: null
});

// Stats
const stats = ref({
  totalBands: 0,
  totalSongs: 0,
  songsWithAudio: 0,
  storageUsed: 0
});

// Load user's bands
const loadMyBands = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/auth');
    return;
  }

  loading.value = true;
  try {
    // Get bands created by current user
    const bands = await bandService.getByUserId(authStore.userId);
    
    // Calculate stats
    let totalSongs = 0;
    let songsWithAudio = 0;
    
    for (const band of bands) {
      // Get songs for each band
      const songs = await songService.getByBandId(band.$id);
      band.songCount = songs.length;
      totalSongs += songs.length;
      songsWithAudio += songs.filter(s => s.audioUrl).length;
    }
    
    myBands.value = bands;
    stats.value = {
      totalBands: bands.length,
      totalSongs,
      songsWithAudio,
      storageUsed: 0 // TODO: Calculate actual storage
    };
  } catch (error) {
    console.error('Error loading bands:', error);
  } finally {
    loading.value = false;
  }
};

// Edit band
const editBand = (band) => {
  // Navigate to edit page (to be implemented)
  router.push(`/band/${band.$id}/edit`);
};

// Confirm delete
const confirmDelete = (band) => {
  deleteModal.value = {
    show: true,
    band
  };
};

// Delete band
const deleteBand = async () => {
  if (!deleteModal.value.band) return;
  
  deleting.value = true;
  try {
    // Delete all songs first
    const songs = await songService.getByBandId(deleteModal.value.band.$id);
    for (const song of songs) {
      await songService.delete(song.$id);
    }
    
    // Delete the band
    await bandService.delete(deleteModal.value.band.$id);
    
    // Remove from list
    myBands.value = myBands.value.filter(b => b.$id !== deleteModal.value.band.$id);
    
    // Update stats
    stats.value.totalBands--;
    stats.value.totalSongs -= deleteModal.value.band.songCount || 0;
    
    deleteModal.value.show = false;
  } catch (error) {
    console.error('Error deleting band:', error);
    alert('Failed to delete band. Please try again.');
  } finally {
    deleting.value = false;
  }
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

// Load data on mount
onMounted(() => {
  loadMyBands();
});
</script>