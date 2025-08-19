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
            <p class="text-gray-300">{{ bandProfile.aiDescription }}</p>
          </div>
        </div>

        <!-- Music Tab -->
        <div v-show="activeTab === 'music'">
          <!-- Album Info -->
          <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800 mb-8">
            <h2 class="text-2xl font-bold mb-2 text-white">{{ bandProfile.albumConcept?.title }}</h2>
            <p class="text-gray-300">{{ bandProfile.albumConcept?.description }}</p>
          </div>

          <!-- Track Listing -->
          <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800">
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
                    v-if="!getSongLyrics(track)"
                    @click="handleGenerateSong(track, index + 1)"
                    :disabled="generatingSongIndex === index"
                    class="bg-mitchly-purple hover:bg-mitchly-purple/80 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Zap v-if="generatingSongIndex !== index" class="w-3 h-3" />
                    <div v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{{ generatingSongIndex === index ? 'Generating...' : 'Generate Song' }}</span>
                  </button>
                  <button
                    v-if="getSongLyrics(track) && !getSongAudio(track)"
                    @click="handleGenerateAudio(track)"
                    :disabled="audioGenerationStatus[track]?.status === 'processing'"
                    class="bg-mitchly-blue hover:bg-mitchly-blue/80 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Music2 v-if="!audioGenerationStatus[track]?.status" class="w-3 h-3" />
                    <div v-else-if="audioGenerationStatus[track]?.status === 'processing'" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>
                      {{ audioGenerationStatus[track]?.status === 'processing' ? 'Generating...' : 'Generate Audio' }}
                    </span>
                  </button>
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
          <!-- Visual Identity Description -->
          <div class="bg-mitchly-gray rounded-lg p-6 border border-gray-800 mb-6">
            <h2 class="text-xl font-bold mb-4 text-white">Visual Identity</h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold mb-2 text-white">Colors</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.colors }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2 text-white">Aesthetic</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.aesthetic }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2 text-white">Logo Concept</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.logo }}</p>
              </div>
              <div>
                <h3 class="font-semibold mb-2 text-white">Overall Style</h3>
                <p class="text-gray-300">{{ bandProfile.visualIdentity?.style }}</p>
              </div>
            </div>
          </div>

          <!-- Generate Images Button -->
          <div v-if="!bandImages.logo && !bandImages.albumCover && !bandImages.bandPhoto" class="mb-6">
            <button
              @click="generateBandImages"
              :disabled="generatingImages"
              class="w-full bg-gradient-to-r from-mitchly-purple to-mitchly-blue hover:from-mitchly-purple/80 hover:to-mitchly-blue/80 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap v-if="!generatingImages" class="w-5 h-5" />
              <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{{ generatingImages ? 'Generating Visual Assets...' : 'Generate Visual Assets with AI' }}</span>
            </button>
          </div>

          <!-- Generated Images Grid -->
          <div v-if="bandImages.logo || bandImages.albumCover || bandImages.bandPhoto" class="grid md:grid-cols-3 gap-6">
            <!-- Band Logo -->
            <div class="bg-mitchly-gray rounded-lg p-4 border border-gray-800">
              <h3 class="font-semibold mb-3 text-white">Band Logo</h3>
              <div v-if="bandImages.logo" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.logo" :alt="`${bandProfile.bandName} logo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-mitchly-dark flex items-center justify-center">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Album Cover -->
            <div class="bg-mitchly-gray rounded-lg p-4 border border-gray-800">
              <h3 class="font-semibold mb-3 text-white">Album Cover</h3>
              <div v-if="bandImages.albumCover" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.albumCover" :alt="`${bandProfile.albumConcept?.title} cover`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-mitchly-dark flex items-center justify-center">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Band Photo -->
            <div class="bg-mitchly-gray rounded-lg p-4 border border-gray-800">
              <h3 class="font-semibold mb-3 text-white">Band Photo</h3>
              <div v-if="bandImages.bandPhoto" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.bandPhoto" :alt="`${bandProfile.bandName} photo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-mitchly-dark flex items-center justify-center">
                <Music class="w-12 h-12 text-gray-600" />
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
import { storageService } from '../services/storage';
import { generateSong } from '../services/anthropic';
import { murekaService } from '../services/mureka';
import { falAIService } from '../services/falai';
import AudioPlayer from '../components/AudioPlayer.vue';
import { 
  Music, 
  Loader, 
  XCircle, 
  Calendar, 
  MapPin, 
  Share2,
  PlayCircle,
  X,
  Zap,
  Music2
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
const generatingSongIndex = ref(null);
const audioGenerationStatus = ref({});
const bandImages = ref({
  logo: null,
  albumCover: null,
  bandPhoto: null
});
const generatingImages = ref(false);

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
    if (band.value?.images) {
      bandImages.value = band.value.images;
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

const handleGenerateSong = async (songTitle, trackNumber) => {
  generatingSongIndex.value = trackNumber - 1;
  
  try {
    const generatedSong = await generateSong(songTitle, trackNumber, bandProfile.value);
    
    // Check if song already exists (placeholder created during band creation)
    const existingSong = songs.value.find(s => s.title === songTitle);
    
    if (existingSong && existingSong.$id) {
      // Update existing song with generated content
      await songService.update(existingSong.$id, {
        lyrics: generatedSong.lyrics,
        description: generatedSong.songDescription,
        artistDescription: generatedSong.artistDescription,
        status: 'completed'
      });
    } else {
      // Create new song if it doesn't exist
      await songService.create({
        bandId: band.value.$id,
        title: songTitle,
        trackNumber,
        lyrics: generatedSong.lyrics,
        description: generatedSong.songDescription,
        artistDescription: generatedSong.artistDescription,
        status: 'completed',
        audioUrl: ''
      });
    }
    
    // Reload songs to get updated data
    songs.value = await songService.getByBandId(band.value.$id);
    
    // Show success
    alert(`Song "${songTitle}" has been generated!`);
  } catch (error) {
    console.error('Error generating song:', error);
    alert('Failed to generate song. Please try again.');
  } finally {
    generatingSongIndex.value = null;
  }
};

const handleGenerateAudio = async (songTitle) => {
  const song = songs.value.find(s => s.title === songTitle);
  if (!song) return;
  
  try {
    audioGenerationStatus.value[songTitle] = { status: 'processing' };
    
    // Format lyrics for Mureka
    const formattedLyrics = murekaService.formatLyricsForMureka(song.lyrics);
    
    // Generate prompt from band profile
    const prompt = murekaService.generatePromptFromProfile(bandProfile.value);
    
    // Start audio generation
    const task = await murekaService.generateAudio(formattedLyrics, prompt);
    
    // Poll for completion
    const result = await murekaService.pollForCompletion(task.taskId, null, 60, 5000);
    
    if (result.songs && result.songs.length > 0) {
      const generatedSong = result.songs[0];
      
      // Update song with audio URL
      await songService.update(song.$id, {
        audioUrl: generatedSong.audioUrl,
        murekaTaskId: task.taskId
      });
      
      // Reload songs
      songs.value = await songService.getByBandId(band.value.$id);
      
      audioGenerationStatus.value[songTitle] = { status: 'completed' };
      alert(`Audio for "${songTitle}" is ready!`);
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    audioGenerationStatus.value[songTitle] = { status: 'failed' };
    alert('Failed to generate audio. Please try again.');
  }
};

const generateBandImages = async () => {
  generatingImages.value = true;
  
  try {
    // Generate images with fal.ai
    const images = await falAIService.generateAllBandImages(bandProfile.value);
    
    if (images.logo || images.albumCover || images.bandPhoto) {
      // Upload images to Appwrite Storage and get permanent URLs
      const uploadedImages = await storageService.uploadBandImages(band.value.$id, images);
      
      // Update local state with uploaded URLs
      bandImages.value = uploadedImages;
      
      // Update band document with permanent image URLs
      await bandService.update(band.value.$id, {
        logoUrl: uploadedImages.logoUrl || '',
        albumCoverUrl: uploadedImages.albumCoverUrl || '',
        bandPhotoUrl: uploadedImages.bandPhotoUrl || '',
        images: uploadedImages // Store all URLs in a JSON field
      });
      
      alert('Visual assets generated and saved successfully!');
    } else {
      alert('Image generation requires Fal.ai API key configuration');
    }
  } catch (error) {
    console.error('Error generating images:', error);
    alert('Failed to generate images. Please try again.');
  } finally {
    generatingImages.value = false;
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