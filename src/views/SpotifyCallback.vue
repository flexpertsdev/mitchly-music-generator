<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center px-4 py-8">
    <!-- Background effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-2xl">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-400">Setting up your profile</span>
          <span class="text-sm text-gray-400">{{ currentStep }}/{{ totalSteps }}</span>
        </div>
        <div class="w-full bg-gray-700/50 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Content Card -->
      <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700/50">
        <!-- Step 1: Processing Spotify Data -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto mb-4 relative">
              <svg class="w-20 h-20 text-green-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <div class="absolute inset-0 animate-spin">
                <svg class="w-20 h-20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="url(#gradient)" stroke-width="2" fill="none" stroke-dasharray="60" stroke-dashoffset="10"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#a855f7"/>
                      <stop offset="100%" stop-color="#ec4899"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-semibold text-white mb-2">
              Analyzing Your Music Taste
            </h2>
            <p class="text-gray-400">
              We're connecting to Spotify and analyzing your listening history...
            </p>
          </div>

          <div class="space-y-3">
            <div v-for="task in tasks" :key="task.id" class="flex items-center space-x-3">
              <div v-if="task.status === 'completed'" class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div v-else-if="task.status === 'loading'" class="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <div v-else class="w-5 h-5 rounded-full border-2 border-gray-600"></div>
              <span :class="task.status === 'completed' ? 'text-white' : 'text-gray-400'">
                {{ task.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Show Music Profile -->
        <div v-else-if="currentStep === 2" class="space-y-6">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-semibold text-white mb-2">
              Your Music Profile
            </h2>
            <p class="text-gray-400">
              Here's what we learned about your music taste
            </p>
          </div>

          <!-- Top Artists -->
          <div>
            <h3 class="text-lg font-medium text-white mb-3">Top Artists</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div v-for="artist in topArtists" :key="artist.id" class="flex items-center space-x-2 bg-gray-700/30 rounded-lg p-2">
                <img :src="artist.image" :alt="artist.name" class="w-10 h-10 rounded-full">
                <span class="text-sm text-gray-300 truncate">{{ artist.name }}</span>
              </div>
            </div>
          </div>

          <!-- Top Genres -->
          <div>
            <h3 class="text-lg font-medium text-white mb-3">Your Genres</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="genre in topGenres" :key="genre" 
                class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                {{ genre }}
              </span>
            </div>
          </div>

          <!-- Music Characteristics -->
          <div>
            <h3 class="text-lg font-medium text-white mb-3">Your Sound</h3>
            <div class="space-y-2">
              <div v-for="trait in musicTraits" :key="trait.name" class="flex items-center justify-between">
                <span class="text-sm text-gray-400">{{ trait.name }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                      :style="{ width: `${trait.value}%` }"></div>
                  </div>
                  <span class="text-xs text-gray-500 w-10 text-right">{{ trait.value }}%</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="nextStep" 
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]">
            Continue
          </button>
        </div>

        <!-- Step 3: Band Generation Preferences -->
        <div v-else-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-semibold text-white mb-2">
              Customize Your AI Bands
            </h2>
            <p class="text-gray-400">
              Tell us what kind of bands you'd like to discover
            </p>
          </div>

          <div class="space-y-4">
            <!-- Experimental Level -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                How experimental should your bands be?
              </label>
              <div class="flex items-center space-x-4">
                <span class="text-xs text-gray-500">Familiar</span>
                <input type="range" v-model="preferences.experimental" 
                  min="0" max="100" 
                  class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
                <span class="text-xs text-gray-500">Wild</span>
              </div>
            </div>

            <!-- Era Preference -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Musical era preference
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="era in eras" :key="era"
                  @click="toggleEra(era)"
                  :class="preferences.eras.includes(era) 
                    ? 'bg-purple-500/30 text-purple-300 border-purple-500' 
                    : 'bg-gray-700/30 text-gray-400 border-gray-600'"
                  class="px-3 py-2 rounded-lg border text-sm transition-all">
                  {{ era }}
                </button>
              </div>
            </div>

            <!-- Band Types -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Types of bands to create
              </label>
              <div class="space-y-2">
                <label v-for="type in bandTypes" :key="type.id" 
                  class="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" v-model="type.selected" 
                    class="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500">
                  <span class="text-sm text-gray-300">{{ type.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <button @click="finishOnboarding" 
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]">
            Generate My Bands
          </button>
        </div>

        <!-- Step 4: Generating Bands -->
        <div v-else-if="currentStep === 4" class="space-y-6">
          <div class="text-center">
            <div class="w-24 h-24 mx-auto mb-4 relative">
              <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-20"></div>
              <div class="absolute inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-40"></div>
              <div class="absolute inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            </div>
            <h2 class="text-2xl font-semibold text-white mb-2">
              Creating Your Bands
            </h2>
            <p class="text-gray-400 mb-4">
              Our AI is crafting unique bands based on your music taste...
            </p>
            <p class="text-sm text-purple-400">
              {{ generationStatus }}
            </p>
          </div>

          <!-- Fun facts while waiting -->
          <div class="bg-gray-700/30 rounded-lg p-4">
            <p class="text-sm text-gray-300">
              <span class="text-purple-400">Did you know?</span> {{ currentFact }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { account, functions, databases, Query, ID } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentStep = ref(1)
const totalSteps = 4

// Step 1: Processing tasks
const tasks = ref([
  { id: 1, label: 'Connecting to Spotify', status: 'loading' },
  { id: 2, label: 'Fetching your top artists', status: 'pending' },
  { id: 3, label: 'Analyzing your music taste', status: 'pending' },
  { id: 4, label: 'Creating your music profile', status: 'pending' }
])

// Step 2: Music profile data
const topArtists = ref([])
const topGenres = ref([])
const musicTraits = ref([
  { name: 'Energy', value: 0 },
  { name: 'Danceability', value: 0 },
  { name: 'Mood', value: 0 },
  { name: 'Acousticness', value: 0 }
])

// Step 3: Preferences
const preferences = ref({
  experimental: 50,
  eras: ['Modern'],
  bandTypes: []
})

const eras = ['60s', '70s', '80s', '90s', '2000s', 'Modern']
const bandTypes = ref([
  { id: 1, label: 'Bands similar to my favorites', selected: true },
  { id: 2, label: 'Experimental fusion bands', selected: false },
  { id: 3, label: 'Undiscovered gems I might like', selected: true },
  { id: 4, label: 'Genre-bending supergroups', selected: false }
])

// Step 4: Generation
const generationStatus = ref('Initializing AI models...')
const funFacts = [
  "Your music taste is as unique as your fingerprint",
  "AI can identify over 1,000 musical features in each song",
  "The average person listens to 30 different artists per month",
  "Music taste is 50% genetic and 50% environmental"
]
const currentFact = ref(funFacts[0])

// Spotify data
const spotifyData = ref(null)

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  
  if (!code) {
    toast.error('Invalid authorization code')
    router.push('/auth')
    return
  }

  await processSpotifyAuth(code, state)
})

const processSpotifyAuth = async (code, state) => {
  try {
    // Step 1: Exchange code for token and get user data
    updateTaskStatus(1, 'completed')
    updateTaskStatus(2, 'loading')

    const response = await functions.createExecution(
      'spotify-callback',
      JSON.stringify({
        code,
        state,
        redirectUri: `${window.location.origin}/spotify-callback`
      })
    )

    const data = JSON.parse(response.responseBody)
    
    if (data.error) {
      throw new Error(data.error)
    }

    // Store Spotify data
    spotifyData.value = data

    // Process the data
    updateTaskStatus(2, 'completed')
    updateTaskStatus(3, 'loading')

    // Extract top artists
    topArtists.value = data.topArtists.slice(0, 6).map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || '/default-artist.png'
    }))

    // Extract genres
    const genreMap = {}
    data.topArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap[genre] = (genreMap[genre] || 0) + 1
      })
    })
    topGenres.value = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre]) => genre)

    // Calculate music traits from audio features
    if (data.audioFeatures) {
      const features = data.audioFeatures
      musicTraits.value = [
        { name: 'Energy', value: Math.round(features.energy * 100) },
        { name: 'Danceability', value: Math.round(features.danceability * 100) },
        { name: 'Mood', value: Math.round(features.valence * 100) },
        { name: 'Acousticness', value: Math.round(features.acousticness * 100) }
      ]
    }

    updateTaskStatus(3, 'completed')
    updateTaskStatus(4, 'loading')

    // Create or update user profile
    await createUserProfile(data)

    updateTaskStatus(4, 'completed')

    // Move to next step after a delay
    setTimeout(() => {
      currentStep.value = 2
    }, 1000)

  } catch (error) {
    console.error('Spotify auth error:', error)
    toast.error('Failed to process Spotify data. Please try again.')
    router.push('/auth')
  }
}

const updateTaskStatus = (taskId, status) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) task.status = status
}

const createUserProfile = async (spotifyData) => {
  try {
    // Create user if not exists
    if (!authStore.user) {
      const user = await account.create(
        ID.unique(),
        spotifyData.userProfile.email,
        ID.unique(), // Random password
        spotifyData.userProfile.display_name
      )
      await authStore.login(spotifyData.userProfile.email, user.$id)
    }

    // Store user preferences
    await databases.createDocument(
      'main',
      'user_preferences',
      ID.unique(),
      {
        userId: authStore.user.$id,
        spotifyId: spotifyData.userProfile.id,
        topArtists: JSON.stringify(spotifyData.topArtists),
        topTracks: JSON.stringify(spotifyData.topTracks),
        topGenres: JSON.stringify(topGenres.value),
        audioFeatures: JSON.stringify(spotifyData.audioFeatures),
        createdAt: new Date().toISOString()
      }
    )
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}

const nextStep = () => {
  currentStep.value++
}

const toggleEra = (era) => {
  const index = preferences.value.eras.indexOf(era)
  if (index > -1) {
    preferences.value.eras.splice(index, 1)
  } else {
    preferences.value.eras.push(era)
  }
}

const finishOnboarding = async () => {
  currentStep.value = 4
  
  // Start rotating fun facts
  let factIndex = 0
  const factInterval = setInterval(() => {
    factIndex = (factIndex + 1) % funFacts.length
    currentFact.value = funFacts[factIndex]
  }, 3000)

  // Generate bands
  try {
    generationStatus.value = 'Analyzing your preferences...'
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    generationStatus.value = 'Creating band concepts...'
    
    // Call generate-bands function
    const response = await functions.createExecution(
      'generate-bands',
      JSON.stringify({
        userId: authStore.user.$id,
        spotifyData: spotifyData.value,
        preferences: {
          experimental: preferences.value.experimental,
          eras: preferences.value.eras,
          types: bandTypes.value.filter(t => t.selected).map(t => t.label)
        }
      })
    )

    const result = JSON.parse(response.responseBody)
    
    if (result.success) {
      clearInterval(factInterval)
      toast.success('Your bands are ready!')
      router.push('/bands')
    } else {
      throw new Error(result.error || 'Failed to generate bands')
    }
    
  } catch (error) {
    console.error('Generation error:', error)
    toast.error('Failed to generate bands. Please try again.')
    clearInterval(factInterval)
  }
}
</script>
