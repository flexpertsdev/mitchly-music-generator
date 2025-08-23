<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Try Mitchly as Guest
        </h1>
        <p class="text-gray-400">Tell us about your music taste and we'll create AI bands for you</p>
      </div>

      <!-- Form Card -->
      <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700/50">
        <form @submit.prevent="generateGuestBands" class="space-y-6">
          <!-- Favorite Artists -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Your favorite artists (at least 3)
            </label>
            <div class="space-y-2">
              <div v-for="(artist, index) in favoriteArtists" :key="index" class="flex space-x-2">
                <input
                  v-model="favoriteArtists[index]"
                  type="text"
                  placeholder="Artist name"
                  class="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                >
                <button
                  v-if="favoriteArtists.length > 3"
                  @click="removeArtist(index)"
                  type="button"
                  class="px-3 py-2 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              @click="addArtist"
              type="button"
              class="mt-2 text-sm text-purple-400 hover:text-purple-300"
            >
              + Add another artist
            </button>
          </div>

          <!-- Favorite Genres -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Select your favorite genres
            </label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label v-for="genre in availableGenres" :key="genre" 
                class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="selectedGenres"
                  :value="genre"
                  class="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                >
                <span class="text-sm text-gray-300">{{ genre }}</span>
              </label>
            </div>
          </div>

          <!-- Music Preferences -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              What kind of music do you enjoy?
            </label>
            <textarea
              v-model="musicDescription"
              rows="3"
              placeholder="I love energetic rock with meaningful lyrics, experimental sounds..."
              class="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isGenerating || !canSubmit"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isGenerating">Generating Your Bands...</span>
            <span v-else>Generate AI Bands</span>
          </button>
        </form>
      </div>

      <!-- Back to Auth -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-400">
          Want the full experience? 
          <router-link to="/auth" class="text-purple-400 hover:text-purple-300 transition-colors">
            Connect with Spotify
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { functions, databases, ID } from '@/lib/appwrite'
import { toast } from 'vue-sonner'

const router = useRouter()

const favoriteArtists = ref(['', '', ''])
const selectedGenres = ref([])
const musicDescription = ref('')
const isGenerating = ref(false)

const availableGenres = [
  'Rock', 'Pop', 'Hip Hop', 'Electronic', 'R&B', 'Jazz',
  'Metal', 'Classical', 'Country', 'Folk', 'Indie', 'Alternative',
  'Soul', 'Funk', 'Blues', 'Reggae', 'Latin', 'World'
]

const canSubmit = computed(() => {
  const filledArtists = favoriteArtists.value.filter(a => a.trim()).length
  return filledArtists >= 3 && selectedGenres.value.length > 0
})

const addArtist = () => {
  favoriteArtists.value.push('')
}

const removeArtist = (index) => {
  favoriteArtists.value.splice(index, 1)
}

const generateGuestBands = async () => {
  if (!canSubmit.value) {
    toast.error('Please fill in at least 3 artists and select some genres')
    return
  }

  try {
    isGenerating.value = true
    
    // Create a guest session
    const guestId = ID.unique()
    
    // Generate bands based on guest input
    const response = await functions.createExecution(
      'generate-guest-bands',
      JSON.stringify({
        guestId,
        favoriteArtists: favoriteArtists.value.filter(a => a.trim()),
        genres: selectedGenres.value,
        description: musicDescription.value,
        count: 3
      })
    )

    const result = JSON.parse(response.responseBody)
    
    if (result.success) {
      toast.success('Bands generated! Redirecting...')
      
      // Store guest session
      localStorage.setItem('guestSession', JSON.stringify({
        guestId,
        bands: result.bands,
        createdAt: new Date().toISOString()
      }))
      
      // Redirect to gallery with guest parameter
      router.push('/gallery?guest=true')
    } else {
      throw new Error(result.error || 'Generation failed')
    }
  } catch (error) {
    console.error('Error generating guest bands:', error)
    toast.error('Failed to generate bands. Please try again.')
  } finally {
    isGenerating.value = false
  }
}
</script>
