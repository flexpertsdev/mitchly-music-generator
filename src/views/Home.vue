<template>
  <div class="home min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
              <span class="text-mitchly-blue">⚡</span>
              Mitchly Music Generator
            </h1>
            <p class="text-gray-400 mt-1">AI-Powered Band & Song Creation Suite</p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Status Indicator -->
            <div 
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                appStatus.isAvailable 
                  ? 'bg-green-900/20 text-green-400 border border-green-800/30' 
                  : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30'
              ]"
            >
              <component 
                :is="appStatus.isAvailable ? Wifi : WifiOff" 
                class="w-4 h-4" 
              />
              <span>{{ appStatus.isAvailable ? 'Online' : 'Offline Mode' }}</span>
            </div>
            
            <router-link 
              to="/gallery"
              class="bg-mitchly-blue/10 hover:bg-mitchly-blue/20 text-mitchly-blue px-4 py-2 rounded-lg transition-all border border-mitchly-blue/30 flex items-center gap-2"
            >
              <Music4 class="w-5 h-5" />
              Gallery
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <!-- Input Section -->
      <ConceptInput 
        @generate="handleGenerate" 
        :loading="generating"
      />

      <!-- Current Band Profile -->
      <div v-if="currentBandProfile" class="mt-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-white">Current Band Profile</h2>
          <div class="flex gap-2">
            <button
              v-if="!savedBandId"
              @click="saveBand"
              :disabled="saving"
              class="bg-mitchly-blue hover:bg-mitchly-blue/80 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save class="w-4 h-4" />
              {{ saving ? 'Saving...' : 'Save Band' }}
            </button>
            <button
              v-if="savedBandId"
              @click="viewBand"
              class="bg-mitchly-purple hover:bg-mitchly-purple/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <ExternalLink class="w-4 h-4" />
              View Page
            </button>
            <button
              v-if="savedBandId"
              @click="copyBandLink"
              class="bg-mitchly-gray hover:bg-mitchly-light-gray text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-700"
            >
              <Copy class="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>

        <!-- Band Saved Success Message -->
        <div v-if="savedBandId && showSaveSuccess" class="mb-4 bg-mitchly-blue/10 border border-mitchly-blue/30 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-mitchly-blue mt-0.5" />
            <div class="flex-1">
              <p class="font-semibold text-mitchly-blue">Band Saved Successfully!</p>
              <p class="text-sm text-gray-300 mt-1">Your band is now live and shareable. Copy the link below to access it later:</p>
              <div class="flex items-center gap-2 mt-2">
                <div class="flex-1 bg-mitchly-gray rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-400 font-mono truncate">
                  {{ getBandUrl() }}
                </div>
                <button
                  @click="copyBandLink"
                  class="bg-mitchly-blue hover:bg-mitchly-blue/80 text-black font-semibold px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1"
                >
                  <Copy class="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <BandProfile 
          :bandProfile="currentBandProfile"
          @generateSong="handleGenerateSong"
          @generateAudio="handleGenerateAudio"
          :generatingSong="generatingSongIndex"
          :audioGenerationStatus="audioGenerationStatus"
        />

        <!-- Audio Player -->
        <div v-if="audioTracks.length > 0" class="mt-6">
          <AudioPlayer 
            :tracks="audioTracks"
            @trackChange="handleTrackChange"
          />
        </div>
      </div>

      <!-- Recent Bands -->
      <div v-if="recentBands.length > 0" class="mt-12">
        <h2 class="text-2xl font-bold text-white mb-4">Recent Bands</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="band in recentBands"
            :key="band.$id"
            class="bg-mitchly-gray rounded-lg border border-gray-800 p-4 hover:bg-mitchly-light-gray hover:border-mitchly-blue/30 transition-all cursor-pointer"
            @click="loadBand(band)"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-mitchly-blue to-mitchly-purple rounded-full flex items-center justify-center">
                <Music class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-white">{{ band.bandName }}</h3>
                <p class="text-sm text-gray-400">{{ band.primaryGenre }}</p>
              </div>
            </div>
            <div class="mt-3 flex justify-between items-center">
              <span class="text-xs text-gray-500">
                {{ new Date(band.$createdAt).toLocaleDateString() }}
              </span>
              <router-link
                :to="`/band/${band.$id}`"
                class="text-mitchly-blue hover:text-mitchly-blue/80 text-sm"
                @click.stop
              >
                View →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 space-y-2 z-50">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="`toast ${toast.type}`"
          class="bg-mitchly-gray border border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px]"
        >
          <div class="flex items-center gap-3">
            <component :is="getToastIcon(toast.type)" class="w-5 h-5" />
            <div class="flex-1">
              <p class="font-semibold text-white">{{ toast.title }}</p>
              <p class="text-sm text-gray-400">{{ toast.message }}</p>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ConceptInput from '../components/ConceptInput.vue';
import BandProfile from '../components/BandProfile.vue';
import AudioPlayer from '../components/AudioPlayer.vue';
import { generateBandProfile, generateSong } from '../services/anthropic';
import { bandService, songService, getAppwriteStatus } from '../services/appwrite';
import { murekaService } from '../services/mureka';
import { 
  Music, 
  Music4, 
  Save, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader,
  Copy,
  Link,
  WifiOff,
  Wifi
} from 'lucide-vue-next';

const router = useRouter();

// State
const currentBandProfile = ref(null);
const generating = ref(false);
const generatingSongIndex = ref(null);
const saving = ref(false);
const savedBandId = ref(null);
const recentBands = ref([]);
const audioTracks = ref([]);
const audioGenerationStatus = ref({});
const toasts = ref([]);
const showSaveSuccess = ref(false);
const appStatus = ref({ isAvailable: true, mode: 'online' });

// Load recent bands on mount
onMounted(async () => {
  // Check app status
  appStatus.value = getAppwriteStatus();
  
  try {
    recentBands.value = await bandService.list(6);
    // Update status after successful load
    appStatus.value = getAppwriteStatus();
  } catch (error) {
    console.error('Error loading recent bands:', error);
    appStatus.value = getAppwriteStatus();
    
    // Show offline mode notification if Appwrite is unavailable
    if (!appStatus.value.isAvailable) {
      showToast('info', 'Offline Mode', 'Database unavailable - your data will be saved locally');
    }
  }
  
  // Check status periodically
  setInterval(() => {
    const newStatus = getAppwriteStatus();
    if (newStatus.isAvailable !== appStatus.value.isAvailable) {
      appStatus.value = newStatus;
      if (newStatus.isAvailable) {
        showToast('success', 'Back Online', 'Database connection restored');
      } else {
        showToast('info', 'Offline Mode', 'Database unavailable - data will be saved locally');
      }
    }
  }, 30000); // Check every 30 seconds
});

// Handlers
const handleGenerate = async (conceptText) => {
  generating.value = true;
  savedBandId.value = null;
  showSaveSuccess.value = false;
  
  try {
    currentBandProfile.value = await generateBandProfile(conceptText);
    showToast('success', 'Band Created!', 'Your band profile has been generated');
  } catch (error) {
    console.error('Error generating band profile:', error);
    showToast('error', 'Generation Failed', error.message);
  } finally {
    generating.value = false;
  }
};

const handleGenerateSong = async (songTitle, trackNumber) => {
  generatingSongIndex.value = trackNumber;
  
  try {
    const song = await generateSong(songTitle, trackNumber, currentBandProfile.value);
    
    // Update the band profile with the generated song
    if (!currentBandProfile.value.songs) {
      currentBandProfile.value.songs = {};
    }
    currentBandProfile.value.songs[songTitle] = song;
    
    showToast('success', 'Song Generated!', `"${songTitle}" has been created`);
  } catch (error) {
    console.error('Error generating song:', error);
    showToast('error', 'Song Generation Failed', error.message);
  } finally {
    generatingSongIndex.value = null;
  }
};

const handleGenerateAudio = async (songTitle, songData) => {
  const songId = songTitle.replace(/\s+/g, '-').toLowerCase();
  
  try {
    // Set initial status
    audioGenerationStatus.value[songId] = {
      status: 'starting',
      message: 'Initiating audio generation...'
    };
    
    // Format lyrics for Mureka
    const formattedLyrics = murekaService.formatLyricsForMureka(songData.lyrics);
    
    // Generate prompt from band profile
    const prompt = murekaService.generatePromptFromProfile(currentBandProfile.value);
    
    // Start audio generation
    const task = await murekaService.generateAudio(formattedLyrics, prompt);
    
    audioGenerationStatus.value[songId] = {
      status: 'processing',
      message: 'Generating audio...',
      taskId: task.taskId
    };
    
    // Poll for completion
    const result = await murekaService.pollForCompletion(
      task.taskId,
      (status) => {
        audioGenerationStatus.value[songId] = {
          status: status.status,
          message: getStatusMessage(status.status),
          taskId: task.taskId
        };
      },
      60, // max attempts
      5000 // interval
    );
    
    // Success!
    if (result.songs && result.songs.length > 0) {
      const generatedSong = result.songs[0];
      
      // Add to audio tracks for player
      audioTracks.value.push({
        id: songId,
        title: songTitle,
        artist: currentBandProfile.value.bandName,
        audioUrl: generatedSong.audioUrl,
        duration: generatedSong.duration
      });
      
      // Update status
      audioGenerationStatus.value[songId] = {
        status: 'completed',
        message: 'Audio ready!',
        audioUrl: generatedSong.audioUrl
      };
      
      // Save to database if band is saved
      if (savedBandId.value) {
        await songService.create({
          bandId: savedBandId.value,
          title: songTitle,
          trackNumber: currentBandProfile.value.trackListing.indexOf(songTitle) + 1,
          lyrics: formattedLyrics,
          description: songData.songDescription,
          audioUrl: generatedSong.audioUrl,
          murekaTaskId: task.taskId,
          status: 'completed'
        });
      }
      
      showToast('success', 'Audio Generated!', `"${songTitle}" is ready to play`);
    }
  } catch (error) {
    console.error('Error generating audio:', error);
    audioGenerationStatus.value[songId] = {
      status: 'failed',
      message: error.message
    };
    showToast('error', 'Audio Generation Failed', error.message);
  }
};

const saveBand = async () => {
  if (!currentBandProfile.value) return;
  
  saving.value = true;
  showSaveSuccess.value = false;
  
  try {
    const band = await bandService.create(currentBandProfile.value);
    savedBandId.value = band.$id;
    
    // Save any generated songs
    if (currentBandProfile.value.songs) {
      for (const [title, songData] of Object.entries(currentBandProfile.value.songs)) {
        await songService.create({
          bandId: band.$id,
          title,
          trackNumber: currentBandProfile.value.trackListing.indexOf(title) + 1,
          lyrics: songData.lyrics,
          description: songData.songDescription,
          status: 'pending'
        });
      }
    }
    
    // Reload recent bands
    recentBands.value = await bandService.list(6);
    
    // Show success message with link
    showSaveSuccess.value = true;
    showToast('success', 'Band Saved!', 'Copy the link to access your band later');
    
    // Auto-hide success message after 30 seconds
    setTimeout(() => {
      showSaveSuccess.value = false;
    }, 30000);
  } catch (error) {
    console.error('Error saving band:', error);
    showToast('error', 'Save Failed', error.message);
  } finally {
    saving.value = false;
  }
};

const viewBand = () => {
  if (savedBandId.value) {
    router.push(`/band/${savedBandId.value}`);
  }
};

const loadBand = (band) => {
  currentBandProfile.value = band.profileData;
  savedBandId.value = band.$id;
  showSaveSuccess.value = false;
  window.scrollTo(0, 0);
};

const handleTrackChange = (track) => {
  console.log('Now playing:', track);
};

const getBandUrl = () => {
  if (!savedBandId.value) return '';
  return `${window.location.origin}/band/${savedBandId.value}`;
};

const copyBandLink = () => {
  const url = getBandUrl();
  navigator.clipboard.writeText(url).then(() => {
    showToast('success', 'Link Copied!', 'Band link has been copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('error', 'Copy Failed', 'Please try again');
  });
};

// Helper functions
const getStatusMessage = (status) => {
  const messages = {
    preparing: 'Preparing generation...',
    queued: 'In queue...',
    running: 'Generating audio...',
    streaming: 'Streaming audio...',
    succeeded: 'Completed!',
    failed: 'Generation failed',
    timeouted: 'Generation timed out',
    cancelled: 'Generation cancelled'
  };
  return messages[status] || 'Processing...';
};

const showToast = (type, title, message) => {
  const id = Date.now();
  toasts.value.push({ id, type, title, message });
  
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }, 5000);
};

const getToastIcon = (type) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Loader
  };
  return icons[type] || AlertCircle;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.toast.success {
  border-left: 4px solid #00E4FF;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.warning {
  border-left: 4px solid #f59e0b;
}

.toast.info {
  border-left: 4px solid #8B5CF6;
}
</style>