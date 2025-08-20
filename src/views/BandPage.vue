<template>
  <div class="band-page min-h-screen bg-mitchly-dark">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <Loader class="w-12 h-12 text-mitchly-blue animate-spin mx-auto" />
        <p class="mt-4 text-gray-400">Loading band profile...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <XCircle class="w-12 h-12 text-red-500 mx-auto" />
        <p class="mt-4 text-white font-semibold">Band not found</p>
        <p class="text-gray-400">{{ error }}</p>
        <router-link to="/" class="mt-4 inline-block text-mitchly-blue hover:text-mitchly-blue/80">
          ← Back to Home
        </router-link>
      </div>
    </div>

    <!-- Band Profile -->
    <div v-else-if="band">
      <!-- Hero Section with Band Image -->
      <div class="relative h-64 md:h-96 bg-gradient-to-br from-mitchly-blue to-mitchly-purple overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0 bg-white/10"></div>
        </div>

        <!-- Band Info Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div class="container mx-auto px-4 md:px-6 pb-6 md:pb-8">
            <div class="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <!-- Band Image/Logo -->
              <div class="w-24 h-24 md:w-32 md:h-32 bg-black/30 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                <Music class="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              
              <!-- Band Details -->
              <div class="flex-1 text-white">
                <h1 class="text-2xl md:text-4xl font-bold mb-2">{{ bandProfile.bandName }}</h1>
                <p class="text-lg md:text-xl text-white/90">{{ bandProfile.primaryGenre }}</p>
                <div class="flex flex-wrap gap-2 md:gap-4 mt-2 md:mt-3">
                  <span class="text-xs md:text-sm text-white/70">
                    <Calendar class="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Formed {{ bandProfile.formationYear }}
                  </span>
                  <span class="text-xs md:text-sm text-white/70">
                    <MapPin class="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                    {{ bandProfile.origin }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 w-full md:w-auto">
                <button
                  @click="copyToClipboard(getBandProfileText(), 'Profile')"
                  class="bg-white/90 hover:bg-white text-mitchly-dark px-3 md:px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg flex-1 md:flex-initial text-sm md:text-base"
                >
                  <Copy v-if="copiedMessage !== 'Profile'" class="w-4 h-4 md:w-5 md:h-5" />
                  <CheckCircle v-else class="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  <span class="hidden sm:inline">{{ copiedMessage === 'Profile' ? 'Copied!' : 'Copy Profile' }}</span>
                  <span class="sm:hidden">{{ copiedMessage === 'Profile' ? 'Copied!' : 'Copy' }}</span>
                </button>
                <button
                  @click="shareBand"
                  class="bg-white/90 hover:bg-white text-mitchly-dark px-3 md:px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg flex-1 md:flex-initial text-sm md:text-base"
                >
                  <Share2 class="w-4 h-4 md:w-5 md:h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-mitchly-darker border-b border-mitchly-gray sticky top-0 z-40">
        <div class="container mx-auto px-4 md:px-6">
          <div class="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-3 md:py-4 px-3 md:px-2 border-b-2 font-medium transition-colors whitespace-nowrap text-sm md:text-base',
                activeTab === tab.id 
                  ? 'border-mitchly-blue text-mitchly-blue' 
                  : 'border-transparent text-gray-400 hover:text-white'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- About -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h2 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <div class="w-1 h-6 bg-mitchly-blue rounded-full"></div>
                About
              </h2>
              <p class="text-gray-300 mb-4 leading-relaxed">{{ bandProfile.backstory }}</p>
              <p class="text-gray-300 leading-relaxed">{{ bandProfile.coreSound }}</p>
            </div>

            <!-- Details -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h2 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <div class="w-1 h-6 bg-mitchly-purple rounded-full"></div>
                Details
              </h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Vocal Style</dt>
                  <dd class="text-white font-medium">{{ bandProfile.vocalStyle?.type || bandProfile.vocalStyle }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Production Style</dt>
                  <dd class="text-white font-medium">{{ bandProfile.productionStyle }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Influences</dt>
                  <dd class="flex flex-wrap gap-2">
                    <Chip 
                      v-for="(influence, idx) in bandProfile.influences"
                      :key="idx"
                      :variant="getChipVariant(idx)"
                    >
                      {{ influence }}
                    </Chip>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Lyrical Themes</dt>
                  <dd class="flex flex-wrap gap-2">
                    <Chip 
                      v-for="(theme, idx) in bandProfile.lyricalThemes"
                      :key="idx"
                      :variant="getChipVariant(idx + 3)"
                    >
                      {{ theme }}
                    </Chip>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Additional Info Grid -->
          <div class="grid md:grid-cols-2 gap-6 mt-8">
            <!-- Band Formation Story -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                Band Formation Story
              </h3>
              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-gray-400">How we met:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.howMet }}</p>
                </div>
                <div>
                  <span class="text-gray-400">Early days:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.earlyDays }}</p>
                </div>
                <div>
                  <span class="text-gray-400">Breakthrough:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.breakthrough }}</p>
                </div>
              </div>
            </div>

            <!-- Visual Identity Style -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Visual Identity Style
              </h3>
              <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentityStyle }}</p>
            </div>
          </div>

          <!-- AI Description -->
          <div class="bg-gradient-to-r from-mitchly-blue/10 to-mitchly-purple/10 rounded-xl p-6 mt-6 border border-mitchly-blue/30 shadow-xl">
            <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
              <div class="w-2 h-2 bg-mitchly-blue rounded-full animate-pulse"></div>
              AI Music Platform Description
            </h3>
            <p class="text-gray-300 leading-relaxed">{{ bandProfile.aiDescription }}</p>
          </div>
        </div>

        <!-- Music Tab -->
        <div v-show="activeTab === 'music'">
          <!-- Album Info -->
          <div class="bg-gradient-to-br from-mitchly-gray to-mitchly-dark rounded-xl p-6 border border-gray-800 mb-8 shadow-xl">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h2 class="text-2xl font-bold mb-3 text-white flex items-center gap-3">
                  <div class="w-12 h-12 bg-mitchly-purple/20 rounded-lg flex items-center justify-center">
                    <Music class="w-6 h-6 text-mitchly-purple" />
                  </div>
                  {{ bandProfile.albumConcept?.title }}
                </h2>
                <p class="text-gray-300 leading-relaxed">{{ bandProfile.albumConcept?.description }}</p>
              </div>
            </div>
          </div>

          <!-- Track Listing -->
          <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
            <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <div class="w-1 h-6 bg-mitchly-blue rounded-full"></div>
              Track Listing
            </h3>
            <div class="space-y-3">
              <div
                v-for="(track, index) in bandProfile.trackListing"
                :key="index"
                class="border border-gray-700 rounded-lg overflow-hidden hover:border-mitchly-blue/50 transition-all duration-300 bg-mitchly-dark/30"
              >
                <!-- Track Header (Always Visible) -->
                <div 
                  class="p-4 hover:bg-mitchly-dark/50 transition-all cursor-pointer"
                  @click="toggleTrack(index)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                      <span class="text-gray-400 w-8">{{ index + 1 }}.</span>
                      <span class="font-medium text-white">{{ track }}</span>
                      <PlayCircle 
                        v-if="getSongAudio(track)" 
                        class="w-5 h-5 text-green-500"
                        title="Audio available"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="!getSongLyrics(track)"
                        @click.stop="handleGenerateSong(track, index + 1)"
                        :disabled="generatingSongIndex === index"
                        class="bg-mitchly-purple hover:bg-mitchly-purple/80 px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Zap v-if="generatingSongIndex !== index" class="w-3 h-3" />
                        <div v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{{ generatingSongIndex === index ? 'Generating...' : 'Generate Lyrics' }}</span>
                      </button>
                      <button
                        v-if="getSongLyrics(track) && !getSongAudio(track)"
                        @click.stop="handleGenerateAudio(track)"
                        :disabled="audioGenerationStatus[track]?.status === 'processing'"
                        class="bg-mitchly-blue hover:bg-mitchly-blue/80 px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Music2 v-if="!audioGenerationStatus[track]?.status" class="w-3 h-3" />
                        <div v-else-if="audioGenerationStatus[track]?.status === 'processing'" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          {{ audioGenerationStatus[track]?.status === 'processing' ? 'Generating...' : 'Generate Audio' }}
                        </span>
                      </button>
                      <!-- Expand/Collapse Icon -->
                      <ChevronDown 
                        :class="['w-5 h-5 text-gray-400 transition-transform', expandedTracks[index] ? 'rotate-180' : '']"
                      />
                    </div>
                  </div>
                  <!-- Song Description Preview (if available) -->
                  <div v-if="getSongDescription(track) && !expandedTracks[index]" class="mt-2 pl-11">
                    <p class="text-sm text-gray-400 line-clamp-2">{{ getSongDescription(track) }}</p>
                  </div>
                </div>

                <!-- Expanded Content -->
                <div v-if="expandedTracks[index]" class="border-t border-gray-700 p-6 bg-mitchly-dark/70">
                  <!-- Song Description -->
                  <div v-if="getSongDescription(track)" class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-300 mb-2">Song Description</h4>
                    <p class="text-gray-400 text-sm">{{ getSongDescription(track) }}</p>
                  </div>
                  
                  <!-- Lyrics -->
                  <div v-if="getSongLyrics(track)">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-semibold text-gray-300">Lyrics</h4>
                      <button
                        @click="copyToClipboard(getSongLyricsForMureka(songs.find(s => s.title === track)), 'Lyrics')"
                        class="bg-green-600/20 hover:bg-green-600/30 px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1 text-green-400 border border-green-600/30"
                      >
                        <Copy v-if="copiedMessage !== 'Lyrics'" class="w-3 h-3" />
                        <CheckCircle v-else class="w-3 h-3" />
                        {{ copiedMessage === 'Lyrics' ? 'Copied!' : 'Copy for Mureka.ai' }}
                      </button>
                    </div>
                    <pre class="whitespace-pre-wrap text-gray-400 text-sm font-sans bg-mitchly-dark/50 p-4 rounded-lg border border-gray-700">{{ getSongLyrics(track) }}</pre>
                  </div>
                  
                  <!-- No Content Message -->
                  <div v-if="!getSongLyrics(track) && !getSongDescription(track)" class="text-center py-4">
                    <p class="text-gray-500 text-sm">Click "Generate Lyrics" to create content for this song</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audio Player -->
          <div v-if="availableAudioTracks.length > 0" class="mt-8">
            <h3 class="text-xl font-bold mb-4 text-white">Listen Now</h3>
            <AudioPlayer 
              :tracks="availableAudioTracks"
              :autoPlay="false"
            />
          </div>
        </div>

        <!-- Visual Tab -->
        <div v-show="activeTab === 'visual'">
          <!-- Visual Identity Description -->
          <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 mb-6 shadow-xl">
            <h2 class="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <div class="w-1 h-6 bg-mitchly-purple rounded-full"></div>
              Visual Identity
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-mitchly-blue rounded-full"></div>
                  Colors
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.colors }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-mitchly-purple rounded-full"></div>
                  Aesthetic
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.aesthetic }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  Logo Concept
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.logo }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Overall Style
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.style }}</p>
              </div>
            </div>
          </div>


          <!-- Generated Images Grid -->
          <div v-if="bandImages.logo || bandImages.albumCover || bandImages.bandPhoto" class="grid md:grid-cols-3 gap-6">
            <!-- Band Logo -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-mitchly-blue rounded-full"></div>
                Band Logo
              </h3>
              <div v-if="bandImages.logo" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.logo" :alt="`${bandProfile.bandName} logo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Album Cover -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-mitchly-purple rounded-full"></div>
                Album Cover
              </h3>
              <div v-if="bandImages.albumCover" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.albumCover" :alt="`${bandProfile.albumConcept?.title} cover`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Band Photo -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                Band Photo
              </h3>
              <div v-if="bandImages.bandPhoto" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.bandPhoto" :alt="`${bandProfile.bandName} photo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 left-4 md:left-auto space-y-2 z-50 pointer-events-none">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'bg-mitchly-gray border rounded-lg shadow-lg p-3 md:p-4 md:min-w-[250px] md:max-w-sm pointer-events-auto transition-all ml-auto',
            toast.type === 'success' ? 'border-green-600/50' : 
            toast.type === 'error' ? 'border-red-600/50' : 'border-gray-700'
          ]"
        >
          <div class="flex items-center gap-2 md:gap-3">
            <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
            <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
            <Music v-else class="w-4 h-4 md:w-5 md:h-5 text-mitchly-blue flex-shrink-0" />
            <p class="text-white text-xs md:text-sm">{{ toast.message }}</p>
          </div>
        </div>
      </transition-group>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { bandService, songService } from '../services/appwrite';
import { generateSong } from '../services/anthropic';
import { murekaService } from '../services/mureka';
import AudioPlayer from '../components/AudioPlayer.vue';
import Chip from '../components/Chip.vue';
import { 
  Music, 
  Loader, 
  XCircle, 
  Calendar, 
  MapPin, 
  Share2,
  PlayCircle,
  ChevronDown,
  Zap,
  Music2,
  Copy,
  CheckCircle
} from 'lucide-vue-next';

const route = useRoute();

// State
const band = ref(null);
const bandProfile = computed(() => band.value?.profileData || {});
const songs = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('overview');
const expandedTracks = ref({});
const generatingSongIndex = ref(null);
const audioGenerationStatus = ref({});
const copiedMessage = ref('');
const bandImages = ref({
  logo: null,
  albumCover: null,
  bandPhoto: null
});
const toasts = ref([]);

// Tabs
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'music', label: 'Music' },
  { id: 'visual', label: 'Visual Identity' }
];

// Computed
const availableAudioTracks = computed(() => {
  return songs.value
    .filter(song => song.audioUrl)
    .map(song => ({
      id: song.$id,
      title: song.title,
      artist: bandProfile.value.bandName,
      audioUrl: song.audioUrl,
      duration: song.duration
    }));
});

// Load band data
onMounted(async () => {
  try {
    const bandId = route.params.id;
    
    // Load band profile
    band.value = await bandService.get(bandId);
    
    // Load songs
    songs.value = await songService.getByBandId(bandId);
    
    // Load saved images if they exist
    if (band.value) {
      bandImages.value = {
        logo: band.value.logoUrl || null,
        albumCover: band.value.albumCoverUrl || null,
        bandPhoto: band.value.bandPhotoUrl || null
      };
    }
  } catch (err) {
    console.error('Error loading band:', err);
    error.value = 'Could not load band profile. Please check the URL and try again.';
  } finally {
    loading.value = false;
  }
});

// Methods
const getSongLyrics = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.lyrics;
};

const getSongAudio = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.audioUrl;
};

const getSongDescription = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.description;
};

const toggleTrack = (index) => {
  expandedTracks.value[index] = !expandedTracks.value[index];
};

const handleGenerateSong = async (songTitle, trackNumber) => {
  generatingSongIndex.value = trackNumber - 1;
  
  try {
    // Check if song already exists to get its ID
    const existingSong = songs.value.find(s => s.title === songTitle);
    
    // Pass songId if it exists, otherwise pass bandId for creation
    const generatedSong = await generateSong(
      songTitle, 
      trackNumber, 
      bandProfile.value,
      existingSong?.$id || null,
      band.value.$id
    );
    
    // The Netlify function now handles database updates directly
    // Just reload the songs to get the updated data
    
    // Reload songs to get updated data
    songs.value = await songService.getByBandId(band.value.$id);
    
    // Expand the track to show the generated lyrics
    expandedTracks.value[trackNumber - 1] = true;
  } catch (error) {
    console.error('Error generating song:', error);
    showToast('Failed to generate song. Please try again.', 'error');
  } finally {
    generatingSongIndex.value = null;
  }
};

const handleGenerateAudio = async (songTitle) => {
  const song = songs.value.find(s => s.title === songTitle);
  if (!song) return;
  
  try {
    audioGenerationStatus.value[songTitle] = { status: 'processing' };
    showToast('Starting audio generation...', 'info');
    
    // Format lyrics for Mureka
    const formattedLyrics = murekaService.formatLyricsForMureka(song.lyrics);
    
    // Generate prompt from band profile and song description
    const prompt = `${bandProfile.value.primaryGenre} style, ${bandProfile.value.vocalStyle?.type || bandProfile.value.vocalStyle}. ${bandProfile.value.coreSound}. Song: "${songTitle}". ${song.description || ''}`;
    
    // Start audio generation using the new API format
    const task = await murekaService.generateAudio(songTitle, prompt, formattedLyrics);
    
    // Poll for completion
    const result = await murekaService.pollAudioGeneration(task.taskId, (status) => {
      console.log('Audio generation progress:', status);
    });
    
    if (result.audioUrl) {
      // Update song with audio URL
      await songService.update(song.$id, {
        audioUrl: result.audioUrl,
        murekaTaskId: task.taskId
      });
      
      // Reload songs
      songs.value = await songService.getByBandId(band.value.$id);
      
      audioGenerationStatus.value[songTitle] = { status: 'completed' };
      showToast(`Audio for "${songTitle}" is ready!`, 'success');
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    audioGenerationStatus.value[songTitle] = { status: 'failed' };
    showToast('Failed to generate audio. Please try again.', 'error');
  }
};


const copyToClipboard = async (text, type = 'Profile') => {
  try {
    await navigator.clipboard.writeText(text);
    copiedMessage.value = type;
    setTimeout(() => copiedMessage.value = '', 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const getBandProfileText = () => {
  return `Band: ${bandProfile.value.bandName}\nGenre: ${bandProfile.value.primaryGenre}\nInfluences: ${bandProfile.value.influences?.join(', ')}\nThemes: ${bandProfile.value.lyricalThemes?.join(', ')}\n\n${bandProfile.value.backstory}\n\nAlbum: ${bandProfile.value.albumConcept?.title}\n${bandProfile.value.albumConcept?.description}`;
};

const getSongLyricsForMureka = (song) => {
  return `Title: ${song.title}\n\n${song.lyrics || 'No lyrics generated yet'}`;
};

const getChipVariant = (index) => {
  const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
  return variants[index % variants.length];
};

const shareBand = () => {
  const url = window.location.href;
  const text = `Check out ${bandProfile.value.bandName} - ${bandProfile.value.primaryGenre} band`;
  
  if (navigator.share) {
    navigator.share({
      title: bandProfile.value.bandName,
      text,
      url
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      showToast('Band link copied to clipboard!', 'success');
    });
  }
};

// Toast notification system
const showToast = (message, type = 'info') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
};
</script>

<style scoped>
.band-page {
  min-height: 100vh;
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>