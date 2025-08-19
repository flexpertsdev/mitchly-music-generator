<template>
  <div class="audio-player bg-gray-900 rounded-lg p-4 border border-gray-700">
    <div class="flex items-center space-x-4">
      <!-- Play/Pause Button -->
      <button
        @click="togglePlayPause"
        :disabled="!audioUrl && !loading"
        class="bg-mitchly-purple hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-full transition-colors"
      >
        <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
        <Pause v-else-if="playing" class="w-5 h-5" />
        <Play v-else class="w-5 h-5" />
      </button>

      <!-- Progress Bar -->
      <div class="flex-1">
        <div class="flex items-center space-x-2 mb-1">
          <span class="text-xs text-gray-400">{{ formatTime(currentTime) }}</span>
          <div class="flex-1 bg-gray-700 rounded-full h-2 relative cursor-pointer" @click="seek">
            <div 
              class="bg-gradient-to-r from-mitchly-purple to-mitchly-blue h-full rounded-full transition-all"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <span class="text-xs text-gray-400">{{ formatTime(duration) }}</span>
        </div>
        <div v-if="title" class="text-sm text-gray-300 truncate">{{ title }}</div>
      </div>

      <!-- Volume Control -->
      <div class="flex items-center space-x-2">
        <button @click="toggleMute" class="text-gray-400 hover:text-white transition-colors">
          <VolumeX v-if="muted" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          v-model="volume"
          @input="updateVolume"
          class="w-20 accent-mitchly-purple"
        />
      </div>

      <!-- Download Button -->
      <a
        v-if="audioUrl"
        :href="audioUrl"
        download
        class="text-gray-400 hover:text-white transition-colors"
      >
        <Download class="w-4 h-4" />
      </a>
    </div>

    <!-- Status Message -->
    <div v-if="statusMessage" class="mt-2 text-sm" :class="statusClass">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Play, Pause, Volume2, VolumeX, Download, Loader2 } from 'lucide-vue-next'
import { Howl } from 'howler'

export default {
  name: 'AudioPlayer',
  components: {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Download,
    Loader2
  },
  props: {
    audioUrl: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: ''
    },
    autoplay: {
      type: Boolean,
      default: false
    }
  },
  emits: ['play', 'pause', 'ended', 'error'],
  setup(props, { emit }) {
    const sound = ref(null)
    const playing = ref(false)
    const loading = ref(false)
    const muted = ref(false)
    const volume = ref(70)
    const currentTime = ref(0)
    const duration = ref(0)
    const statusMessage = ref('')
    const statusType = ref('info')

    const progress = computed(() => {
      if (!duration.value) return 0
      return (currentTime.value / duration.value) * 100
    })

    const statusClass = computed(() => {
      return {
        'text-green-400': statusType.value === 'success',
        'text-red-400': statusType.value === 'error',
        'text-blue-400': statusType.value === 'info',
        'text-yellow-400': statusType.value === 'warning'
      }
    })

    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const loadAudio = () => {
      if (!props.audioUrl) return

      // Clean up previous sound
      if (sound.value) {
        sound.value.unload()
      }

      loading.value = true
      statusMessage.value = 'Loading audio...'
      statusType.value = 'info'

      sound.value = new Howl({
        src: [props.audioUrl],
        html5: true,
        volume: volume.value / 100,
        onload: () => {
          loading.value = false
          duration.value = sound.value.duration()
          statusMessage.value = 'Audio loaded'
          statusType.value = 'success'
          setTimeout(() => statusMessage.value = '', 3000)
          
          if (props.autoplay) {
            play()
          }
        },
        onplay: () => {
          playing.value = true
          emit('play')
          requestAnimationFrame(updateProgress)
        },
        onpause: () => {
          playing.value = false
          emit('pause')
        },
        onend: () => {
          playing.value = false
          currentTime.value = 0
          emit('ended')
        },
        onerror: (id, error) => {
          loading.value = false
          playing.value = false
          statusMessage.value = `Error loading audio: ${error}`
          statusType.value = 'error'
          emit('error', error)
        }
      })
    }

    const play = () => {
      if (sound.value) {
        sound.value.play()
      }
    }

    const pause = () => {
      if (sound.value) {
        sound.value.pause()
      }
    }

    const togglePlayPause = () => {
      if (playing.value) {
        pause()
      } else {
        play()
      }
    }

    const toggleMute = () => {
      muted.value = !muted.value
      if (sound.value) {
        sound.value.mute(muted.value)
      }
    }

    const updateVolume = () => {
      if (sound.value) {
        sound.value.volume(volume.value / 100)
      }
    }

    const seek = (event) => {
      if (!sound.value || !duration.value) return
      
      const rect = event.currentTarget.getBoundingClientRect()
      const percent = (event.clientX - rect.left) / rect.width
      const seekTime = percent * duration.value
      
      sound.value.seek(seekTime)
      currentTime.value = seekTime
    }

    const updateProgress = () => {
      if (sound.value && playing.value) {
        currentTime.value = sound.value.seek() || 0
        requestAnimationFrame(updateProgress)
      }
    }

    // Watch for URL changes
    watch(() => props.audioUrl, (newUrl) => {
      if (newUrl) {
        loadAudio()
      }
    })

    onMounted(() => {
      if (props.audioUrl) {
        loadAudio()
      }
    })

    onUnmounted(() => {
      if (sound.value) {
        sound.value.unload()
      }
    })

    return {
      playing,
      loading,
      muted,
      volume,
      currentTime,
      duration,
      progress,
      statusMessage,
      statusClass,
      formatTime,
      togglePlayPause,
      toggleMute,
      updateVolume,
      seek
    }
  }
}
</script>

<style scoped>
.audio-player {
  min-height: 80px;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #374151;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #9333ea;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  margin-top: -4px;
}

input[type="range"]::-moz-range-track {
  background: #374151;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  background: #9333ea;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  border: none;
}
</style>