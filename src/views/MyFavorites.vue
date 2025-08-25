<template>
  <div class="min-h-screen bg-mitchly-dark">
    <!-- Header with Actions -->
    <AppHeader pageTitle="My Favorites">
      <template #actions>
        <div class="flex items-center justify-between gap-4">
          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span>{{ totalFavorites }} items</span>
          </div>
          
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

          <!-- Play All Button (for tracks tab) -->
          <button
            v-if="activeTab === 'tracks' && favoriteTracks.length > 0"
            @click="playAllTracks"
            class="bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg"
          >
            <PlayCircle class="w-5 h-5" />
            <span>Play All</span>
          </button>
        </div>
      </template>
    </AppHeader>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-gray-800">
        <button
          @click="activeTab = 'bands'"
          :class="[
            'px-6 py-3 font-medium transition-all relative',
            activeTab === 'bands'
              ? 'text-mitchly-blue'
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Bands
          <span class="ml-2 text-sm opacity-60">({{ favoriteBandsCount }})</span>
          <div 
            v-if="activeTab === 'bands'" 
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-mitchly-blue"
          />
        </button>
        
        <button
          @click="activeTab = 'albums'"
          :class="[
            'px-6 py-3 font-medium transition-all relative',
            activeTab === 'albums'
              ? 'text-mitchly-blue'
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Albums
          <span class="ml-2 text-sm opacity-60">({{ favoriteAlbumsCount }})</span>
          <div 
            v-if="activeTab === 'albums'" 
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-mitchly-blue"
          />
        </button>
        
        <button
          @click="activeTab = 'tracks'"
          :class="[
            'px-6 py-3 font-medium transition-all relative',
            activeTab === 'tracks'
              ? 'text-mitchly-blue'
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Tracks
          <span class="ml-2 text-sm opacity-60">({{ favoriteTracksCount }})</span>
          <div 
            v-if="activeTab === 'tracks'" 
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-mitchly-blue"
          />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader class="w-8 h-8 text-mitchly-blue animate-spin" />
      </div>

      <!-- Bands Tab -->
      <div v-else-if="activeTab === 'bands'">
        <!-- Empty State -->
        <div v-if="favoriteBands.length === 0" class="text-center py-20">
          <Users class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No Favorite Bands</h3>
          <p class="text-gray-400 mb-6">Bands you favorite will appear here.</p>
          <router-link 
            to="/gallery"
            class="inline-flex items-center gap-2 bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-6 py-3 rounded-lg transition-all"
          >
            <Search class="w-5 h-5" />
            Discover Bands
          </router-link>
        </div>

        <!-- Bands Grid -->
        <draggable
          v-else-if="viewMode === 'grid'"
          v-model="favoriteBands"
          @end="onDragEnd"
          item-key="$id"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          :disabled="!enableDragDrop"
        >
          <template #item="{element: band}">
            <div class="bg-mitchly-gray rounded-lg overflow-hidden border border-gray-800 hover:border-mitchly-blue/50 transition-all cursor-move">
              <!-- Band Image -->
              <div class="aspect-square relative bg-gradient-to-br from-mitchly-purple to-mitchly-blue">
                <img 
                  v-if="band.albumCoverUrl || band.bandPhotoUrl" 
                  :src="band.albumCoverUrl || band.bandPhotoUrl" 
                  :alt="band.bandName"
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center">
                  <Music class="w-12 h-12 text-white/80" />
                </div>
              </div>

              <!-- Band Info -->
              <div class="p-4">
                <h3 class="font-bold text-lg text-white mb-1 truncate">{{ band.bandName }}</h3>
                <p class="text-sm text-gray-400 mb-4">{{ band.primaryGenre }}</p>
                
                <!-- Actions -->
                <div class="flex gap-2">
                  <router-link
                    :to="`/band/${band.$id}`"
                    class="flex-1 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white text-center py-2 rounded-lg transition-colors text-sm"
                  >
                    View
                  </router-link>
                  <button
                    @click="removeFavoriteBand(band.$id)"
                    class="px-3 py-2 bg-mitchly-dark hover:bg-red-600/20 rounded-lg transition-colors border border-gray-700 hover:border-red-600/50"
                    title="Remove from favorites"
                  >
                    <HeartOff class="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Bands List -->
        <draggable
          v-else
          v-model="favoriteBands"
          @end="onDragEnd"
          item-key="$id"
          class="space-y-2"
          :disabled="!enableDragDrop"
        >
          <template #item="{element: band}">
            <div class="bg-mitchly-gray rounded-lg p-4 border border-gray-800 hover:border-mitchly-blue/50 transition-all cursor-move">
              <div class="flex items-center gap-4">
                <!-- Band Image -->
                <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-mitchly-purple to-mitchly-blue flex-shrink-0">
                  <img 
                    v-if="band.albumCoverUrl || band.bandPhotoUrl" 
                    :src="band.albumCoverUrl || band.bandPhotoUrl" 
                    :alt="band.bandName"
                    class="w-full h-full object-cover rounded-lg"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Music class="w-8 h-8 text-white/80" />
                  </div>
                </div>

                <!-- Band Info -->
                <div class="flex-1">
                  <h3 class="font-bold text-white">{{ band.bandName }}</h3>
                  <p class="text-sm text-gray-400">{{ band.primaryGenre }}</p>
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
                    @click="removeFavoriteBand(band.$id)"
                    class="p-2 bg-mitchly-dark hover:bg-red-600/20 rounded-lg transition-colors border border-gray-700 hover:border-red-600/50"
                    title="Remove from favorites"
                  >
                    <HeartOff class="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Albums Tab -->
      <div v-else-if="activeTab === 'albums'">
        <!-- Empty State -->
        <div v-if="favoriteAlbums.length === 0" class="text-center py-20">
          <Disc class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No Favorite Albums</h3>
          <p class="text-gray-400 mb-6">Albums you favorite will appear here.</p>
          <router-link 
            to="/gallery"
            class="inline-flex items-center gap-2 bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-6 py-3 rounded-lg transition-all"
          >
            <Search class="w-5 h-5" />
            Discover Albums
          </router-link>
        </div>

        <!-- Albums content (similar structure to bands) -->
        <div v-else class="text-center py-20 text-gray-400">
          Album favorites coming soon...
        </div>
      </div>

      <!-- Tracks Tab -->
      <div v-else-if="activeTab === 'tracks'">
        <!-- Empty State -->
        <div v-if="favoriteTracks.length === 0" class="text-center py-20">
          <Music2 class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No Favorite Tracks</h3>
          <p class="text-gray-400 mb-6">Tracks you favorite will appear here.</p>
          <router-link 
            to="/gallery"
            class="inline-flex items-center gap-2 bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-6 py-3 rounded-lg transition-all"
          >
            <Search class="w-5 h-5" />
            Discover Music
          </router-link>
        </div>

        <!-- Tracks List -->
        <draggable
          v-else
          v-model="favoriteTracks"
          @end="onDragEnd"
          item-key="$id"
          class="space-y-2"
          :disabled="!enableDragDrop"
        >
          <template #item="{element: track, index}">
            <div class="bg-mitchly-gray rounded-lg p-4 border border-gray-800 hover:border-mitchly-blue/50 transition-all cursor-move">
              <div class="flex items-center gap-4">
                <!-- Track Number -->
                <div class="w-8 text-center text-gray-500 font-mono">
                  {{ index + 1 }}
                </div>

                <!-- Track Info -->
                <div class="flex-1">
                  <h3 class="font-bold text-white">{{ track.title }}</h3>
                  <p class="text-sm text-gray-400">{{ track.bandName || 'Unknown Artist' }}</p>
                </div>

                <!-- Duration -->
                <div class="text-sm text-gray-500">
                  {{ formatDuration(track.audioDuration) }}
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button
                    v-if="track.audioUrl"
                    @click="playTrack(track)"
                    class="p-2 bg-mitchly-blue hover:bg-mitchly-blue/80 text-white rounded-lg transition-colors"
                    title="Play"
                  >
                    <Play class="w-4 h-4" />
                  </button>
                  <button
                    @click="removeFavoriteTrack(track.$id)"
                    class="p-2 bg-mitchly-dark hover:bg-red-600/20 rounded-lg transition-colors border border-gray-700 hover:border-red-600/50"
                    title="Remove from favorites"
                  >
                    <HeartOff class="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Drag & Drop Toggle -->
    <div class="fixed bottom-4 right-4">
      <button
        @click="enableDragDrop = !enableDragDrop"
        :class="[
          'px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg',
          enableDragDrop
            ? 'bg-mitchly-blue text-white'
            : 'bg-mitchly-gray text-gray-400 hover:text-white'
        ]"
      >
        <GripVertical class="w-5 h-5" />
        <span>{{ enableDragDrop ? 'Reordering' : 'Reorder' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { useFavoritesStore } from '@/stores/favoritesNew';
import { bandService, albumService, songService } from '@/services/appwrite';
import AppHeader from '@/components/navigation/AppHeader.vue';
import {
  Users,
  Music,
  Music2,
  Disc,
  PlayCircle,
  Play,
  Grid3x3,
  List,
  Loader,
  Search,
  Eye,
  HeartOff,
  GripVertical
} from 'lucide-vue-next';

const router = useRouter();
const favoritesStore = useFavoritesStore();

// State
const loading = ref(true);
const activeTab = ref('bands');
const viewMode = ref('grid');
const enableDragDrop = ref(false);
const favoriteBands = ref([]);
const favoriteAlbums = ref([]);
const favoriteTracks = ref([]);

// Computed
const favoriteBandsCount = computed(() => favoritesStore.favoriteBandsCount);
const favoriteAlbumsCount = computed(() => favoritesStore.favoriteAlbumsCount);
const favoriteTracksCount = computed(() => favoritesStore.favoriteTracksCount);
const totalFavorites = computed(() => favoritesStore.totalFavoritesCount);

// Load favorite items with full data
const loadFavorites = async () => {
  loading.value = true;
  try {
    const items = await favoritesStore.getFavoriteItems();
    
    // Separate by type
    const bands = [];
    const albums = [];
    const tracks = [];
    
    for (const item of items) {
      if (item.data) {
        if (item.itemType === 'band') {
          bands.push(item.data);
        } else if (item.itemType === 'album') {
          albums.push(item.data);
        } else if (item.itemType === 'song') {
          // Get band info for track
          if (item.data.bandId) {
            try {
              const band = await bandService.get(item.data.bandId);
              tracks.push({
                ...item.data,
                bandName: band.bandName
              });
            } catch {
              tracks.push(item.data);
            }
          } else {
            tracks.push(item.data);
          }
        }
      }
    }
    
    favoriteBands.value = bands;
    favoriteAlbums.value = albums;
    favoriteTracks.value = tracks;
  } catch (error) {
    console.error('Error loading favorites:', error);
  } finally {
    loading.value = false;
  }
};

// Remove from favorites
const removeFavoriteBand = async (bandId) => {
  await favoritesStore.removeBand(bandId);
  favoriteBands.value = favoriteBands.value.filter(b => b.$id !== bandId);
};

const removeFavoriteAlbum = async (albumId) => {
  await favoritesStore.removeAlbum(albumId);
  favoriteAlbums.value = favoriteAlbums.value.filter(a => a.$id !== albumId);
};

const removeFavoriteTrack = async (trackId) => {
  await favoritesStore.removeTrack(trackId);
  favoriteTracks.value = favoriteTracks.value.filter(t => t.$id !== trackId);
};

// Drag and drop
const onDragEnd = async () => {
  const itemIds = activeTab.value === 'bands' 
    ? favoriteBands.value.map(b => b.$id)
    : activeTab.value === 'albums'
    ? favoriteAlbums.value.map(a => a.$id)
    : favoriteTracks.value.map(t => t.$id);
    
  await favoritesStore.reorderFavorites(itemIds);
};

// Play track
const playTrack = (track) => {
  // TODO: Implement audio player
  console.log('Playing track:', track);
};

// Play all tracks
const playAllTracks = () => {
  // TODO: Implement play all functionality
  console.log('Playing all tracks:', favoriteTracks.value);
};

// Format duration
const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Load data on mount
onMounted(() => {
  loadFavorites();
});
</script>