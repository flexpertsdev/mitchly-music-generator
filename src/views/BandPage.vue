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
                class="bg-white/90 hover:bg-white text-mitchly-dark px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold shadow-lg"
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
                class="border border-gray-700 rounded-lg overflow-hidden"
              >
                <!-- Track Header (Always Visible) -->
                <div 
                  class="p-3 hover:bg-mitchly-dark transition-colors cursor-pointer"
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
                        class="bg-mitchly-purple hover:bg-mitchly-purple/80 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Zap v-if="generatingSongIndex !== index" class="w-3 h-3" />
                        <div v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{{ generatingSongIndex === index ? 'Generating...' : 'Generate Lyrics' }}</span>
                      </button>
                      <button
                        v-if="getSongLyrics(track) && !getSongAudio(track)"
                        @click.stop="handleGenerateAudio(track)"
                        :disabled="audioGenerationStatus[track]?.status === 'processing'"
                        class="bg-mitchly-blue hover:bg-mitchly-blue/80 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 disabled:opacity-50"
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
                <div v-if="expandedTracks[index]" class="border-t border-gray-700 p-4 bg-mitchly-dark/50">
                  <!-- Song Description -->
                  <div v-if="getSongDescription(track)" class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-300 mb-2">Song Description</h4>
                    <p class="text-gray-400 text-sm">{{ getSongDescription(track) }}</p>
                  </div>
                  
                  <!-- Lyrics -->
                  <div v-if="getSongLyrics(track)">
                    <h4 class="text-sm font-semibold text-gray-300 mb-2">Lyrics</h4>
                    <pre class="whitespace-pre-wrap text-gray-400 text-sm font-sans">{{ getSongLyrics(track) }}</pre>
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { bandService, songService } from '../services/appwrite';
import { generateSong } from '../services/anthropic';
import { murekaService } from '../services/mureka';
import AudioPlayer from '../components/AudioPlayer.vue';
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
const expandedTracks = ref({});
const generatingSongIndex = ref(null);
const audioGenerationStatus = ref({});
const bandImages = ref({
  logo: null,
  albumCover: null,
  bandPhoto: null
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
      alert(`Audio for "${songTitle}" is ready!`);
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    audioGenerationStatus.value[songTitle] = { status: 'failed' };
    alert('Failed to generate audio. Please try again.');
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