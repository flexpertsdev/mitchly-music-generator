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
      <div class="relative h-96 bg-gradient-to-br from-mitchly-blue to-mitchly-purple overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0 bg-white/10"></div>
        </div>

        <!-- Band Info Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div class="container mx-auto px-6 pb-8">
            <div class="flex items-end gap-6">
              <!-- Band Image/Logo -->
              <div class="w-32 h-32 bg-black/30 backdrop-blur rounded-lg flex items-center justify-center">
                <Music class="w-16 h-16 text-white" />
              </div>
              
              <!-- Band Details -->
              <div class="flex-1 text-white">
                <h1 class="text-4xl font-bold mb-2">{{ bandProfile.bandName }}</h1>
                <p class="text-xl text-white/90">{{ bandProfile.primaryGenre }}</p>
                <div class="flex gap-4 mt-3">
                  <span class="text-sm text-white/70">
                    <Calendar class="inline w-4 h-4 mr-1" />
                    Formed {{ bandProfile.formationYear }}
                  </span>
                  <span class="text-sm text-white/70">
                    <MapPin class="inline w-4 h-4 mr-1" />
                    {{ bandProfile.origin }}
                  </span>
                </div>
              </div>

              <!-- Share Button -->
              <button
                @click="shareBand"
                class="bg-mitchly-blue/10 backdrop-blur hover:bg-mitchly-blue/20 px-4 py-2 rounded-lg transition-all border border-mitchly-blue/30 flex items-center gap-2 text-mitchly-blue"
              >
                <Share2 class="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-mitchly-darker border-b border-mitchly-gray sticky top-0 z-40">
        <div class="container mx-auto px-6">
          <div class="flex gap-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-4 px-2 border-b-2 font-medium transition-colors',
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
      <div class="container mx-auto px-6 py-8">
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- About -->
            <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
              <h2 class="text-xl font-bold mb-4 text-white">About</h2>
              <p class="text-gray-300 mb-4">{{ bandProfile.backstory }}</p>
              <p class="text-gray-300">{{ bandProfile.coreSound }}</p>
            </div>

            <!-- Details -->
            <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
              <h2 class="text-xl font-bold mb-4 text-white">Details</h2>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm text-gray-400">Vocal Style</dt>
                  <dd class="text-white">{{ bandProfile.vocalStyle?.type || bandProfile.vocalStyle }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400">Influences</dt>
                  <dd class="text-white">{{ bandProfile.influences?.join(', ') }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400">Themes</dt>
                  <dd class="text-white">{{ bandProfile.lyricalThemes?.join(', ') }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- AI Description -->
          <div class="bg-gradient-to-r from-mitchly-blue/10 to-mitchly-purple/10 rounded-lg p-6 mt-8 border border-gray-800">
            <h3 class="font-semibold mb-2 text-white">AI Music Platform Description</h3>
            <p class="text-gray-700">{{ bandProfile.aiDescription }}</p>
          </div>
        </div>

        <!-- Music Tab -->
        <div v-show="activeTab === 'music'">
          <!-- Album Info -->
          <div class="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 class="text-2xl font-bold mb-2 text-white">{{ bandProfile.albumConcept?.title }}</h2>
            <p class="text-gray-700">{{ bandProfile.albumConcept?.description }}</p>
          </div>

          <!-- Track Listing -->
          <div class="bg-white rounded-lg p-6 shadow-sm">
            <h3 class="text-xl font-bold mb-4 text-white">Track Listing</h3>
            <div class="space-y-3">
              <div
                v-for="(track, index) in bandProfile.trackListing"
                :key="index"
                class="flex items-center justify-between p-3 hover:bg-mitchly-dark rounded-lg transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="text-gray-400 w-8">{{ index + 1 }}.</span>
                  <span class="font-medium text-white">{{ track }}</span>
                  <PlayCircle 
                    v-if="getSongAudio(track)" 
                    class="w-5 h-5 text-green-500"
                    title="Audio available"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    v-if="getSongLyrics(track)"
                    @click="showLyrics(track)"
                    class="text-mitchly-blue hover:text-mitchly-blue/80 text-sm"
                  >
                    View Lyrics
                  </button>
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
          <div class="bg-white rounded-lg p-6 shadow-sm">
            <h2 class="text-xl font-bold mb-4">Visual Identity</h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold mb-2">Colors</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.colors }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2">Aesthetic</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.aesthetic }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2">Logo Concept</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.logo }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2">Overall Style</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.style }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lyrics Modal -->
    <div 
      v-if="lyricsModal.show" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="lyricsModal.show = false"
    >
      <div 
        class="bg-mitchly-gray rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6 border border-gray-800"
        @click.stop
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-bold text-white">{{ lyricsModal.title }}</h3>
          <button 
            @click="lyricsModal.show = false"
            class="text-gray-400 hover:text-white"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        <pre class="whitespace-pre-wrap text-gray-300 font-sans">{{ lyricsModal.lyrics }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { bandService, songService } from '../services/appwrite';
import AudioPlayer from '../components/AudioPlayer.vue';
import { 
  Music, 
  Loader, 
  XCircle, 
  Calendar, 
  MapPin, 
  Share2,
  PlayCircle,
  X
} from 'lucide-vue-next';

const route = useRoute();

// State
const band = ref(null);
const bandProfile = computed(() => band.value?.profileData || {});
const songs = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('overview');
const lyricsModal = ref({
  show: false,
  title: '',
  lyrics: ''
});

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

const showLyrics = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  if (song) {
    lyricsModal.value = {
      show: true,
      title: trackTitle,
      lyrics: song.lyrics
    };
  }
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
      alert('Band link copied to clipboard!');
    });
  }
};
</script>

<style scoped>
.band-page {
  min-height: 100vh;
}
</style>