<template>
  <div class="challenge-view min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <AppHeader :pageTitle="currentStep === 'intro' ? '' : 'The Mitchly Challenge'">
      <template #actions v-if="currentStep === 'game'">
        <div class="flex items-center justify-center">
          <div class="timer-container bg-mitchly-gray rounded-lg px-6 py-3 border border-gray-800">
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-400">Time to Listen & Decide</div>
              <div class="timer-display font-mono text-3xl font-bold" :class="timerClass">
                {{ formatTime(timeRemaining) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </AppHeader>

    <!-- Challenge Introduction -->
    <section v-if="currentStep === 'intro'" class="challenge-intro">
      <div class="container mx-auto px-6 py-8 lg:py-20">
        <!-- Mobile Challenge Header -->
        <div class="lg:hidden text-center mb-8">
          <div class="inline-flex items-center px-6 py-3 rounded-lg bg-mitchly-gray/40 border border-mitchly-blue/30 backdrop-blur-sm">
            <h2 class="text-lg font-semibold text-mitchly-blue">The Mitchly Challenge</h2>
          </div>
        </div>

        <div class="max-w-4xl mx-auto text-center">
          <!-- Hero Title -->
          <h1 class="hero-title font-black mb-8 bg-gradient-to-r from-mitchly-blue via-mitchly-purple to-pink-500 bg-clip-text text-transparent">
            <!-- Desktop shows full title, mobile shows shorter version -->
            <span class="hidden lg:block">How Fast Can You<br>Spot The AI?</span>
            <span class="lg:hidden">Can You<br>Spot The AI?</span>
          </h1>
          
          <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Two incredible tracks from independent creators. One made traditionally, one with AI assistance. Can you tell which is which?
          </p>
          
          <!-- Challenge Rules Card -->
          <div class="bg-mitchly-gray rounded-2xl p-8 border border-gray-800 mb-8 max-w-2xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="text-center">
                <div class="text-3xl mb-3">⏱️</div>
                <h3 class="font-bold text-white mb-2">3 Minutes</h3>
                <p class="text-sm text-gray-400">Listen as much as you want</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-3">🎵</div>
                <h3 class="font-bold text-white mb-2">2 Mystery Artists</h3>
                <p class="text-sm text-gray-400">No spoilers!</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-3">🤖</div>
                <h3 class="font-bold text-white mb-2">Traditional vs AI</h3>
                <p class="text-sm text-gray-400">Both incredible creators</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-3">👂</div>
                <h3 class="font-bold text-white mb-2">Trust Your Ears</h3>
                <p class="text-sm text-gray-400">No visual clues</p>
              </div>
            </div>
            
            <div class="mt-8">
              <button 
                @click="startChallenge"
                :disabled="loading"
                class="w-full bg-gradient-to-r from-mitchly-blue to-mitchly-purple hover:from-blue-600 hover:to-purple-600 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader v-if="loading" class="w-6 h-6 animate-spin mx-auto" />
                <span v-else>Start Challenge</span>
              </button>
            </div>
          </div>

          <p class="text-sm text-gray-500">
            Listen carefully... the reveal will surprise you! 🎧
          </p>
        </div>
      </div>
    </section>

    <!-- Game Section -->
    <section v-if="currentStep === 'game'" class="game-section min-h-screen flex flex-col">
      <div class="container mx-auto px-6 py-4 flex-1 flex flex-col max-h-screen overflow-hidden">
        <!-- Instructions (Compact) -->
        <div class="text-center mb-4 flex-shrink-0">
          <h2 class="text-xl lg:text-2xl font-bold text-white mb-1">Listen carefully to both mystery tracks</h2>
          <p class="text-sm lg:text-base text-mitchly-purple font-medium">Which one used AI assistance? 🎧</p>
        </div>

        <!-- Desktop: Side by Side Cards (Compact) -->
        <div class="hidden lg:grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-6 flex-shrink-0">
          <div 
            v-for="(song, index) in challengeSongs" 
            :key="song.id"
            class="challenge-band-card bg-mitchly-gray rounded-lg border border-gray-800 hover:border-mitchly-blue/30 transition-all duration-300 overflow-hidden group flex flex-col"
            :class="{ 
              'ring-2 ring-mitchly-purple border-mitchly-purple': currentlyPlaying === index 
            }"
          >
            <!-- Mystery Track Label -->
            <div class="absolute top-4 left-4 z-10">
              <div class="bg-black/70 text-white border border-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                Track {{ String.fromCharCode(65 + index) }}
              </div>
            </div>

            <!-- Mystery Album Art / Blurred Band Image -->
            <div class="relative h-32 overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
              <!-- Blurred background image if available -->
              <img 
                v-if="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                :src="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                :alt="'Mystery Track'"
                class="w-full h-full object-cover blur-3xl opacity-30"
              />
              
              <!-- Mystery overlay -->
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-6xl mb-4 opacity-60">🎵</div>
                  <div class="text-lg font-bold text-white/80">Mystery Track {{ String.fromCharCode(65 + index) }}</div>
                  <div class="text-sm text-gray-400 mt-2">Genre: {{ song.genre }}</div>
                </div>
              </div>
              
              <!-- Playing indicator overlay -->
              <div 
                v-if="currentlyPlaying === index"
                class="absolute inset-0 bg-mitchly-purple/20 flex items-center justify-center"
              >
                <div class="bg-black/60 rounded-full p-6 border-2 border-mitchly-purple">
                  <div class="flex items-center gap-3 text-white">
                    <div class="animate-pulse text-2xl">▶</div>
                    <div>
                      <div class="text-lg font-bold">NOW PLAYING</div>
                      <div class="text-sm opacity-80">Track {{ String.fromCharCode(65 + index) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Listen status -->
              <div v-if="hasListened[index] && currentlyPlaying !== index" class="absolute top-4 right-4 bg-green-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                ✓ HEARD
              </div>
            </div>

            <!-- Mystery Track Info -->
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-xl text-white mb-1">??? ??? ???</h3>
              <h4 class="text-base text-gray-500 mb-1 font-mono">Track {{ String.fromCharCode(65 + index) }}</h4>
              <p class="text-sm text-mitchly-blue mb-3">{{ song.genre }}</p>
              
              <!-- Mystery Description (Compact) -->
              <div class="bg-black/20 rounded-lg p-3 mb-4">
                <p class="text-xs text-gray-300">
                  🤫 Listen for clues in production and sound
                </p>
              </div>
              
              <!-- Audio Player Controls -->
              <div class="space-y-3">
                <!-- Enhanced Waveform Visualization -->
                <div class="waveform-container h-12 flex items-center justify-center gap-1 bg-black/30 rounded-lg p-2 border border-gray-700">
                  <div 
                    v-for="bar in 24" 
                    :key="bar"
                    class="waveform-bar bg-gradient-to-t from-mitchly-blue to-mitchly-purple rounded-full w-1 opacity-20 transition-all duration-150"
                    :class="{ 
                      'animate-pulse opacity-90 scale-y-150': currentlyPlaying === index,
                      'opacity-40': hasListened[index] && currentlyPlaying !== index
                    }"
                    :style="{ height: getBarHeight(bar) + 'px' }"
                  ></div>
                </div>

                <!-- Play Button -->
                <button
                  @click="togglePlay(index)"
                  class="w-full bg-mitchly-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
                  :class="{ 
                    'bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50': currentlyPlaying === index 
                  }"
                >
                  <Play v-if="currentlyPlaying !== index" class="w-6 h-6" />
                  <Pause v-else class="w-6 h-6" />
                  <span>{{ currentlyPlaying === index ? 'Pause Track' : `Play Track ${String.fromCharCode(65 + index)}` }}</span>
                </button>

                <!-- Listening Progress -->
                <div v-if="hasListened[index]" class="text-center">
                  <div class="inline-flex items-center gap-2 text-green-400 text-sm bg-green-400/10 px-3 py-1 rounded-full border border-green-400/30">
                    <CheckCircle class="w-4 h-4" />
                    <span>Track heard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile/Tablet: Tabbed Interface -->
        <div class="lg:hidden max-w-2xl mx-auto mb-4 flex-shrink-0">
          <!-- Tab Headers -->
          <div class="flex bg-mitchly-gray rounded-t-lg border border-gray-800">
            <button
              v-for="(song, index) in challengeSongs"
              :key="`tab-${index}`"
              @click="activeTab = index"
              class="flex-1 py-4 px-6 font-bold text-center transition-all duration-200 relative"
              :class="{
                'bg-mitchly-blue text-white': activeTab === index,
                'text-gray-400 hover:text-white hover:bg-mitchly-gray/50': activeTab !== index
              }"
            >
              <!-- Tab indicator -->
              <div class="flex items-center justify-center gap-2">
                <span>Track {{ String.fromCharCode(65 + index) }}</span>
                <div v-if="currentlyPlaying === index" class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <div v-else-if="hasListened[index]" class="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              
              <!-- Playing indicator line -->
              <div 
                v-if="currentlyPlaying === index"
                class="absolute bottom-0 left-0 right-0 h-1 bg-red-400 animate-pulse"
              ></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="bg-mitchly-gray rounded-b-lg border-x border-b border-gray-800">
            <div 
              v-for="(song, index) in challengeSongs"
              :key="`content-${index}`"
              v-show="activeTab === index"
              class="challenge-tab-content"
            >
              <!-- Mystery Album Art -->
              <div class="relative h-32 overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
                <!-- Blurred background image if available -->
                <img 
                  v-if="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                  :src="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                  :alt="'Mystery Track'"
                  class="w-full h-full object-cover blur-3xl opacity-30"
                />
                
                <!-- Mystery overlay -->
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-8xl mb-4 opacity-60">🎵</div>
                    <div class="text-xl font-bold text-white/80">Mystery Track {{ String.fromCharCode(65 + index) }}</div>
                    <div class="text-sm text-gray-400 mt-2">{{ song.genre }}</div>
                  </div>
                </div>
                
                <!-- Playing indicator overlay -->
                <div 
                  v-if="currentlyPlaying === index"
                  class="absolute inset-0 bg-mitchly-purple/20 flex items-center justify-center"
                >
                  <div class="bg-black/60 rounded-full p-6 border-2 border-mitchly-purple">
                    <div class="flex items-center gap-3 text-white">
                      <div class="animate-pulse text-2xl">▶</div>
                      <div>
                        <div class="text-lg font-bold">NOW PLAYING</div>
                        <div class="text-sm opacity-80">Track {{ String.fromCharCode(65 + index) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Track Info -->
              <div class="p-4">
                <h3 class="font-bold text-xl text-white mb-1">??? ??? ???</h3>
                <h4 class="text-base text-gray-500 mb-1 font-mono">Track {{ String.fromCharCode(65 + index) }}</h4>
                <p class="text-sm text-mitchly-blue mb-3">{{ song.genre }}</p>
                
                <!-- Mystery Description (Compact) -->
                <div class="bg-black/20 rounded-lg p-3 mb-4">
                  <p class="text-xs text-gray-300">
                    🤫 Listen for clues in production and sound
                  </p>
                </div>
                
                <!-- Audio Controls -->
                <div class="space-y-3">
                  <!-- Waveform -->
                  <div class="waveform-container h-12 flex items-center justify-center gap-1 bg-black/30 rounded-lg p-2 border border-gray-700">
                    <div 
                      v-for="bar in 24" 
                      :key="bar"
                      class="waveform-bar bg-gradient-to-t from-mitchly-blue to-mitchly-purple rounded-full w-1 opacity-20 transition-all duration-150"
                      :class="{ 
                        'animate-pulse opacity-90 scale-y-150': currentlyPlaying === index,
                        'opacity-40': hasListened[index] && currentlyPlaying !== index
                      }"
                      :style="{ height: getBarHeight(bar) + 'px' }"
                    ></div>
                  </div>

                  <!-- Play Button -->
                  <button
                    @click="togglePlay(index)"
                    class="w-full bg-mitchly-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
                    :class="{ 
                      'bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50': currentlyPlaying === index 
                    }"
                  >
                    <Play v-if="currentlyPlaying !== index" class="w-6 h-6" />
                    <Pause v-else class="w-6 h-6" />
                    <span>{{ currentlyPlaying === index ? 'Pause Track' : `Play Track ${String.fromCharCode(65 + index)}` }}</span>
                  </button>

                  <!-- Progress indicator -->
                  <div v-if="audioProgress[index] > 0" class="text-center text-sm text-gray-400">
                    Progress: {{ formatTime(audioProgress[index]) }}
                  </div>

                  <!-- Listening Status -->
                  <div v-if="hasListened[index]" class="text-center">
                    <div class="inline-flex items-center gap-2 text-green-400 text-sm bg-green-400/10 px-3 py-1 rounded-full border border-green-400/30">
                      <CheckCircle class="w-4 h-4" />
                      <span>Track heard</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Separator -->
        <div class="my-4 flex items-center justify-center">
          <div class="w-full max-w-md h-px bg-gradient-to-r from-transparent via-mitchly-purple/50 to-transparent"></div>
        </div>

        <!-- Guess Section (Always Visible) -->
        <div class="guess-section max-w-2xl mx-auto flex-shrink-0 mt-auto">
          <div class="text-center mb-4">
            <h3 class="text-lg lg:text-xl font-bold text-white mb-1">Make Your Choice</h3>
            <p class="text-sm text-gray-400">Which track used AI assistance?</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="(song, index) in challengeSongs"
              :key="`guess-${index}`"
              @click="makeGuess(index)"
              class="bg-mitchly-gray hover:bg-mitchly-light-gray border-2 border-gray-700 hover:border-mitchly-purple text-white font-bold py-4 lg:py-6 px-4 rounded-xl transition-all duration-200"
              :class="{ 
                'border-mitchly-purple bg-mitchly-purple/20 ring-2 ring-mitchly-purple/50': userGuess === index 
              }"
            >
              <div class="text-center">
                <div class="text-2xl lg:text-3xl mb-2">{{ index === 0 ? '🎸' : '🌊' }}</div>
                <div class="text-base lg:text-lg font-mono mb-1">Track {{ String.fromCharCode(65 + index) }}</div>
                <div class="text-xs text-gray-400 mb-2">{{ song.genre }}</div>
                <div class="text-xs font-medium text-mitchly-purple">Choose This</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Results -->
    <section v-if="currentStep === 'results'" class="results-section">
      <div class="container mx-auto px-6 py-12">
        <div class="max-w-4xl mx-auto">
          <!-- Results Header -->
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4" :class="resultsHeaderClass">
              {{ resultsTitle }}
            </h2>
            <div class="text-4xl font-black font-mono mb-4" :class="timeScoreClass">
              Decided in {{ finalTime }}
            </div>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto" v-html="resultsMessage"></p>
          </div>

          <!-- THE BIG REVEAL -->
          <div class="text-center mb-8">
            <h3 class="text-3xl font-bold text-mitchly-purple mb-4">🎭 The Big Reveal!</h3>
            <p class="text-gray-300">Meet the amazing artists behind the mystery tracks</p>
          </div>

          <!-- Artist Reveals - Full Band Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div 
              v-for="(song, index) in challengeSongs"
              :key="`reveal-${index}`"
              class="band-reveal bg-mitchly-gray rounded-lg border-2 overflow-hidden transform transition-all duration-500 hover:scale-105"
              :class="{ 
                'border-green-500 shadow-green-500/20': index !== aiSongIndex,
                'border-mitchly-purple shadow-mitchly-purple/20': index === aiSongIndex
              }"
            >
              <!-- Creator Type Badge -->
              <div class="absolute top-4 left-4 z-10">
                <div 
                  class="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg animate-pulse"
                  :class="{ 
                    'bg-green-500 text-black': index !== aiSongIndex,
                    'bg-mitchly-purple text-white': index === aiSongIndex
                  }"
                >
                  {{ index === aiSongIndex ? 'AI Creator - @jossticles' : 'Independent Artist' }}
                </div>
              </div>

              <!-- Track Label -->
              <div class="absolute top-4 right-4 z-10">
                <div class="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Was Track {{ String.fromCharCode(65 + index) }}
                </div>
              </div>

              <!-- Full Band Image Reveal -->
              <div class="relative h-64 overflow-hidden bg-gradient-to-br from-mitchly-blue to-mitchly-purple">
                <img 
                  v-if="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                  :src="song.bandPhotoUrl || song.albumCoverUrl || song.logoUrl"
                  :alt="song.bandName"
                  class="w-full h-full object-cover"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center">
                  <Music class="w-16 h-16 text-white/80" />
                </div>

                <!-- Reveal overlay effect -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

              <!-- Full Band Info Reveal -->
              <div class="p-6">
                <h3 class="text-3xl font-bold text-white mb-2">{{ song.bandName }}</h3>
                <h4 class="text-xl text-mitchly-blue mb-3">{{ song.title }}</h4>
                <p class="text-mitchly-purple font-medium mb-4">{{ song.genre }}</p>
                
                <!-- Full Description -->
                <p class="text-gray-300 mb-4 leading-relaxed">
                  {{ song.metadata?.description || 'An incredible track showcasing unique artistry and creativity.' }}
                </p>

                <!-- Band Details -->
                <div class="flex items-center gap-4 text-sm text-gray-400 mb-6 flex-wrap">
                  <span v-if="song.metadata?.year" class="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                    <Calendar class="w-3 h-3" />
                    {{ song.metadata.year }}
                  </span>
                  <span v-if="song.metadata?.location" class="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                    <MapPin class="w-3 h-3" />
                    {{ song.metadata.location }}
                  </span>
                </div>
                
                <!-- Explore Band Button -->
                <router-link
                  :to="`/band/${song.bandId}`"
                  class="block w-full bg-mitchly-blue hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center text-lg"
                >
                  🎵 Explore {{ song.bandName }}
                </router-link>
              </div>
            </div>
          </div>

          <!-- Community Message -->
          <div class="community-message bg-gradient-to-r from-mitchly-blue/20 to-mitchly-purple/20 rounded-2xl p-8 border border-gray-700 text-center mb-8">
            <h3 class="text-2xl font-bold text-white mb-4">🎉 Enjoy 2 new amazing independent creators!</h3>
            <p class="text-lg text-gray-300 mb-4">
              At Mitchly we support a diverse and vibrant music community for fans, creators and independent artists.
            </p>
            <p class="text-2xl font-bold text-mitchly-purple">Rock on! 🤘</p>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <router-link
              to="/gallery"
              class="bg-mitchly-blue hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
            >
              <Music class="w-5 h-5" />
              Discover More Artists
            </router-link>
            <router-link
              to="/"
              class="bg-mitchly-purple hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
            >
              <Plus class="w-5 h-5" />
              Create Your Music
            </router-link>
            <button
              @click="restartChallenge"
              class="bg-mitchly-gray hover:bg-mitchly-light-gray border border-gray-700 hover:border-mitchly-blue text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw class="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { challengeService } from '@/services/appwrite'
import AppHeader from '@/components/navigation/AppHeader.vue'
import { 
  Play, 
  Pause, 
  Music, 
  Plus, 
  RotateCcw, 
  Loader,
  Calendar,
  MapPin,
  CheckCircle
} from 'lucide-vue-next'

// Component state
const currentStep = ref('intro') // 'intro', 'game', 'results'
const loading = ref(false)
const challengeSongs = ref([])
const challengeId = ref(null)
const aiSongIndex = ref(0)

// Mobile tab state
const activeTab = ref(0)

// Timer state (3 minutes = 180 seconds)
const timeRemaining = ref(180)
const gameTimer = ref(null)
const gameStartTime = ref(null)
const finalTime = ref('')

// Audio state with resume functionality
const currentlyPlaying = ref(null)
const hasListened = ref([false, false])
const audioElements = ref([])
const audioProgress = ref([0, 0]) // Track current time for each audio

// Challenge state
const userGuess = ref(null)
const isCorrect = ref(false)

// Computed properties
const timerClass = computed(() => {
  if (timeRemaining.value <= 30) return 'text-red-400'
  if (timeRemaining.value <= 60) return 'text-yellow-400'
  return 'text-green-400'
})

const resultsTitle = computed(() => {
  if (timeRemaining.value <= 0) return '⏰ Time\'s Up!'
  return isCorrect.value ? '🎯 Great Ear!' : '🤔 So Close!'
})

const resultsHeaderClass = computed(() => {
  if (timeRemaining.value <= 0) return 'text-yellow-400'
  return isCorrect.value ? 'text-green-400' : 'text-blue-400'
})

const timeScoreClass = computed(() => {
  return 'text-mitchly-purple'
})

const resultsMessage = computed(() => {
  if (!challengeSongs.value.length) return ''
  
  const aiSong = challengeSongs.value[aiSongIndex.value]
  const humanSong = challengeSongs.value[aiSongIndex.value === 0 ? 1 : 0]
  
  if (timeRemaining.value <= 0) {
    return `
      You took the full time to listen! Great job exploring both tracks.<br><br>
      <strong>${aiSong.title} by ${aiSong.bandName}</strong> was created with AI assistance by @jossticles, 
      while <strong>${humanSong.title} by ${humanSong.bandName}</strong> was made using traditional methods.<br><br>
      Both artists are pushing creative boundaries in their own unique way!
    `
  }
  
  if (isCorrect.value) {
    return `
      Excellent! You correctly identified that <strong>${aiSong.title} by ${aiSong.bandName}</strong> was created with AI assistance.<br><br>
      You have a great ear for music. Both artists show how creativity evolves - 
      whether through traditional methods or AI-assisted creation, great music is great music.
    `
  } else {
    return `
      Close call! <strong>${humanSong.title} by ${humanSong.bandName}</strong> was actually made traditionally, 
      while <strong>${aiSong.title} by ${aiSong.bandName}</strong> was created with AI assistance.<br><br>
      Both approaches create amazing music - that's what makes this challenge so interesting! 
      The future of music creation is diverse and exciting.
    `
  }
})

// Methods
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startChallenge = async () => {
  loading.value = true
  try {
    const response = await challengeService.getChallengeSongs()
    
    if (response.success) {
      challengeSongs.value = response.songs
      challengeId.value = response.challengeId  
      aiSongIndex.value = response.aiSongIndex
      gameStartTime.value = Date.now()
      
      // Initialize audio elements
      initializeAudio()
      
      currentStep.value = 'game'
      startTimer()
    } else {
      throw new Error(response.error || 'Failed to load challenge')
    }
  } catch (error) {
    console.error('Error starting challenge:', error)
    // Use mock data for demo
    challengeSongs.value = [
      {
        id: '1',
        title: 'Toxic Paradise',
        bandName: 'Velvet Rebellion',
        bandId: '68a61c7a0017c5e6057d',
        genre: 'Dark Pop-Rap Fusion',
        audioUrl: null,
        bandPhotoUrl: null,
        albumCoverUrl: null,
        logoUrl: null,
        metadata: {
          year: 2022,
          location: 'Miami, USA',
          description: 'A dark exploration of paradise lost in the modern world, blending rap verses with haunting pop melodies'
        }
      },
      {
        id: '2', 
        title: 'Dancehall at Low Tide',
        bandName: 'Velvet Anchor',
        bandId: '68aa0b6500321edac170',
        genre: 'Alternative Folk-Noir',
        audioUrl: null,
        bandPhotoUrl: null,
        albumCoverUrl: null,
        logoUrl: null,
        metadata: {
          year: 2021,
          location: 'Newport, Oregon, USA',
          description: 'Haunting folk-noir ballad with Caribbean percussion influences, weaving isolation into unity through three distinct voices'
        }
      }
    ]
    challengeId.value = 'demo-challenge'
    aiSongIndex.value = 1 // Velvet Anchor is the "AI" song
    gameStartTime.value = Date.now()
    
    currentStep.value = 'game'
    startTimer()
  } finally {
    loading.value = false
  }
}

const initializeAudio = () => {
  audioElements.value = challengeSongs.value.map((song, index) => {
    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl)
      audio.preload = 'metadata'
      
      // Track progress for resume functionality
      audio.addEventListener('timeupdate', () => {
        audioProgress.value[index] = audio.currentTime
      })
      
      return audio
    }
    return null
  })
}

const startTimer = () => {
  gameTimer.value = setInterval(() => {
    timeRemaining.value--
    
    if (timeRemaining.value <= 0) {
      // Auto-end game when time runs out
      if (userGuess.value === null) {
        // Force them to make a choice or make random guess
        const randomChoice = Math.floor(Math.random() * 2)
        makeGuess(randomChoice, true)
      }
    }
  }, 1000)
}

const togglePlay = (trackIndex) => {
  if (currentlyPlaying.value === trackIndex) {
    // Pause current track (but remember position)
    pauseAudio(trackIndex)
  } else {
    // Pause any other playing track and resume this one from where it left off
    if (currentlyPlaying.value !== null) {
      pauseAudio(currentlyPlaying.value)
    }
    resumeAudio(trackIndex)
  }
}

const resumeAudio = (trackIndex) => {
  const audio = audioElements.value[trackIndex]
  
  currentlyPlaying.value = trackIndex
  hasListened.value[trackIndex] = true
  
  // Switch tab to playing track on mobile
  activeTab.value = trackIndex
  
  if (audio) {
    // Resume from saved position
    audio.currentTime = audioProgress.value[trackIndex]
    audio.play()
    
    // Handle audio end
    audio.addEventListener('ended', () => {
      pauseAudio(trackIndex)
    })
  } else {
    // Simulate playback for demo
    console.log(`Resuming mystery track ${trackIndex} from ${formatTime(audioProgress.value[trackIndex])}: ${challengeSongs.value[trackIndex].title}`)
  }
}

const pauseAudio = (trackIndex) => {
  const audio = audioElements.value[trackIndex]
  
  if (audio) {
    audio.pause()
    // Don't reset currentTime - keep position for resume
  }
  
  if (currentlyPlaying.value === trackIndex) {
    currentlyPlaying.value = null
  }
}

const makeGuess = (guessIndex, forced = false) => {
  userGuess.value = guessIndex
  
  // Stop timer and audio
  if (gameTimer.value) {
    clearInterval(gameTimer.value)
    gameTimer.value = null
  }
  
  if (currentlyPlaying.value !== null) {
    pauseAudio(currentlyPlaying.value)
  }
  
  // Calculate final time
  if (gameStartTime.value) {
    const totalTime = 180 // 3 minutes
    const timeUsed = totalTime - timeRemaining.value
    finalTime.value = formatTime(timeUsed)
  } else {
    finalTime.value = 'Unknown'
  }
  
  // Determine if correct
  isCorrect.value = guessIndex === aiSongIndex.value
  
  // Submit results
  submitResults()
  
  // Show results
  setTimeout(() => {
    currentStep.value = 'results'
  }, 1000)
}

const submitResults = async () => {
  try {
    await challengeService.submitResult({
      challengeId: challengeId.value,
      userGuess: userGuess.value,
      correctAnswer: aiSongIndex.value,
      isCorrect: isCorrect.value,
      listeningTime: 180 - timeRemaining.value,
      songsPlayed: hasListened.value.map((listened, index) => listened ? index : null).filter(i => i !== null),
      audioProgress: audioProgress.value
    })
  } catch (error) {
    console.error('Error submitting challenge result:', error)
  }
}

const restartChallenge = () => {
  // Reset all state
  currentStep.value = 'intro'
  timeRemaining.value = 180
  currentlyPlaying.value = null
  hasListened.value = [false, false]
  audioProgress.value = [0, 0]
  activeTab.value = 0
  userGuess.value = null
  isCorrect.value = false
  finalTime.value = ''
  challengeSongs.value = []
  challengeId.value = null
  
  // Clear timers
  if (gameTimer.value) {
    clearInterval(gameTimer.value)
    gameTimer.value = null
  }
  
  // Clean up audio
  audioElements.value.forEach(audio => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  })
  audioElements.value = []
}

const getBarHeight = (barIndex) => {
  const heights = [8, 16, 12, 24, 16, 20, 8, 16, 12, 28, 16, 12, 20, 24, 8, 16, 20, 12, 24, 16, 8, 20, 12, 16, 18, 22, 14, 26, 18, 10, 14, 20]
  return heights[barIndex % heights.length]
}

const handleImageError = (event, song) => {
  event.target.style.display = 'none'
}

// Cleanup on component unmount
onUnmounted(() => {
  if (gameTimer.value) {
    clearInterval(gameTimer.value)
  }
  audioElements.value.forEach(audio => {
    if (audio) {
      audio.pause()
    }
  })
})

// SEO
defineOptions({
  name: 'Challenge'
})
</script>

<style scoped>
.hero-title {
  @apply text-4xl sm:text-5xl md:text-6xl lg:text-7xl;
}

.challenge-band-card {
  position: relative;
}

.challenge-tab-content {
  position: relative;
}

.waveform-bar {
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.waveform-bar:nth-child(odd) { animation-delay: 0.1s; }
.waveform-bar:nth-child(even) { animation-delay: 0.2s; }
.waveform-bar:nth-child(3n) { animation-delay: 0.3s; }

@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
    transform: scaleY(1);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.8);
  }
}

.waveform-bar:nth-child(odd).animate-pulse {
  animation-name: pulse;
}
.waveform-bar:nth-child(even).animate-pulse {
  animation-delay: 0.1s;
  animation-name: pulse;
}

/* Tab transition */
.challenge-tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>