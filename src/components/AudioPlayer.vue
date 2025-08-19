<template>
  <div class="audio-player bg-gray-900 rounded-lg p-4 shadow-lg">
    <!-- Player Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-white font-semibold">{{ currentTrack?.title || 'No track selected' }}</h3>
        <p class="text-gray-400 text-sm">{{ currentTrack?.artist || 'Select a song to play' }}</p>
      </div>
      <button 
        v-if="currentTrack?.audioUrl"
        @click="downloadAudio"
        class="text-gray-400 hover:text-white transition-colors"
        title="Download"
      >
        <Download class="w-5 h-5" />
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="mb-4" v-if="currentTrack">
      <div class="relative bg-gray-700 rounded-full h-2 cursor-pointer" @click="seek">
        <div 
          class="absolute bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center space-x-4">
      <button 
        @click="previous"
        class="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        :disabled="!hasPrevious"
      >
        <SkipBack class="w-5 h-5" />
      </button>

      <button 
        @click="togglePlay"
        class="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-3 hover:scale-105 transition-transform disabled:opacity-50"
        :disabled="!currentTrack"
      >
        <component :is="isPlaying ? Pause : Play" class="w-6 h-6" />
      </button>

      <button 
        @click="next"
        class="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        :disabled="!hasNext"
      >
        <SkipForward class="w-5 h-5" />
      </button>
    </div>

    <!-- Volume Control -->
    <div class="flex items-center mt-4 space-x-2">
      <Volume2 class="w-4 h-4 text-gray-400" />
      <input 
        type="range"
        min="0"
        max="100"
        v-model="volume"
        @input="updateVolume"
        class="flex-1 accent-purple-600"
      />
      <span class="text-xs text-gray-400 w-8">{{ volume }}%</span>
    </div>

    <!-- Playlist (if provided) -->
    <div v-if="playlist.length > 1" class="mt-4 border-t border-gray-700 pt-4">
      <h4 class="text-sm font-semibold text-gray-300 mb-2">Playlist</h4>
      <div class="max-h-32 overflow-y-auto">
        <div
          v-for="(track, index) in playlist"
          :key="track.id"
          @click="playTrack(index)"
          class="flex items-center p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors"
          :class="{ 'bg-gray-800': currentTrackIndex === index }"
        >
          <div class="mr-3">
            <component 
              :is="currentTrackIndex === index && isPlaying ? Music2 : Music" 
              class="w-4 h-4"
              :class="currentTrackIndex === index ? 'text-purple-500' : 'text-gray-400'"
            />
          </div>
          <div class="flex-1">
            <p class="text-sm text-white">{{ track.title }}</p>
            <p class="text-xs text-gray-400">{{ track.artist }}</p>
          </div>
          <span class="text-xs text-gray-500">{{ track.duration || '--:--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Howl, Howler } from 'howler';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Download, 
  Music,
  Music2 
} from 'lucide-vue-next';

const props = defineProps({
  tracks: {
    type: Array,
    default: () => []
  },
  autoPlay: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['trackChange', 'playbackEnd']);

// State
const playlist = ref([]);
const currentTrackIndex = ref(0);
const currentTrack = computed(() => playlist.value[currentTrackIndex.value]);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});
const volume = ref(70);
const hasPrevious = computed(() => currentTrackIndex.value > 0);
const hasNext = computed(() => currentTrackIndex.value < playlist.value.length - 1);

// Howler instance
let sound = null;
let progressInterval = null;

// Watch for track changes
watch(() => props.tracks, (newTracks) => {
  playlist.value = newTracks.map(track => ({
    id: track.id || Math.random().toString(36).substr(2, 9),
    title: track.title || 'Untitled',
    artist: track.artist || track.bandName || 'Unknown Artist',
    audioUrl: track.audioUrl,
    duration: track.duration
  }));
  
  if (playlist.value.length > 0 && props.autoPlay) {
    playTrack(0);
  }
}, { immediate: true });

// Methods
const playTrack = (index) => {
  if (index < 0 || index >= playlist.value.length) return;
  
  // Stop current track
  if (sound) {
    sound.unload();
  }
  
  currentTrackIndex.value = index;
  const track = playlist.value[index];
  
  if (!track.audioUrl) {
    console.error('No audio URL for track:', track);
    return;
  }
  
  // Create new Howl instance
  sound = new Howl({
    src: [track.audioUrl],
    html5: true,
    volume: volume.value / 100,
    onplay: () => {
      isPlaying.value = true;
      duration.value = sound.duration();
      startProgressTracking();
    },
    onpause: () => {
      isPlaying.value = false;
      stopProgressTracking();
    },
    onstop: () => {
      isPlaying.value = false;
      currentTime.value = 0;
      stopProgressTracking();
    },
    onend: () => {
      isPlaying.value = false;
      stopProgressTracking();
      if (hasNext.value) {
        next();
      } else {
        emit('playbackEnd');
      }
    },
    onerror: (id, error) => {
      console.error('Playback error:', error);
      isPlaying.value = false;
      stopProgressTracking();
    }
  });
  
  sound.play();
  emit('trackChange', track);
};

const togglePlay = () => {
  if (!sound) {
    if (currentTrack.value) {
      playTrack(currentTrackIndex.value);
    }
    return;
  }
  
  if (isPlaying.value) {
    sound.pause();
  } else {
    sound.play();
  }
};

const previous = () => {
  if (hasPrevious.value) {
    playTrack(currentTrackIndex.value - 1);
  }
};

const next = () => {
  if (hasNext.value) {
    playTrack(currentTrackIndex.value + 1);
  }
};

const seek = (event) => {
  if (!sound || !duration.value) return;
  
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  const seekTime = duration.value * percentage;
  
  sound.seek(seekTime);
  currentTime.value = seekTime;
};

const updateVolume = () => {
  if (sound) {
    sound.volume(volume.value / 100);
  }
  Howler.volume(volume.value / 100);
};

const startProgressTracking = () => {
  stopProgressTracking();
  progressInterval = setInterval(() => {
    if (sound && isPlaying.value) {
      currentTime.value = sound.seek();
    }
  }, 100);
};

const stopProgressTracking = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const downloadAudio = () => {
  if (currentTrack.value?.audioUrl) {
    const link = document.createElement('a');
    link.href = currentTrack.value.audioUrl;
    link.download = `${currentTrack.value.title}.mp3`;
    link.click();
  }
};

// Cleanup
onUnmounted(() => {
  stopProgressTracking();
  if (sound) {
    sound.unload();
  }
});
</script>

<style scoped>
.audio-player {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #4B5563;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #9333EA;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  margin-top: -6px;
}

input[type="range"]::-moz-range-track {
  background: #4B5563;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  background: #9333EA;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: none;
}
</style>