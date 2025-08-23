<template>
  <div class="min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-center">
          <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/ic_launcher-web.png" 
              alt="Mitchly" 
              class="w-10 h-10 rounded-lg"
            />
            <h1 class="text-2xl font-bold text-white">Mitchly</h1>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-12 max-w-md">
      <div class="bg-mitchly-gray rounded-xl p-8 border border-gray-800">
        <!-- Title -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-white mb-2">Welcome to Mitchly</h2>
          <p class="text-gray-400">Connect your Spotify to create AI bands from your music taste</p>
        </div>

        <!-- Features -->
        <div class="space-y-4 mb-8">
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check class="w-3 h-3 text-green-500" />
            </div>
            <div>
              <p class="text-white font-medium">Analyze Your Music Taste</p>
              <p class="text-gray-400 text-sm">We'll analyze your top artists and listening patterns</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check class="w-3 h-3 text-green-500" />
            </div>
            <div>
              <p class="text-white font-medium">Generate Unique AI Bands</p>
              <p class="text-gray-400 text-sm">Create bands tailored to your musical preferences</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check class="w-3 h-3 text-green-500" />
            </div>
            <div>
              <p class="text-white font-medium">Discover Original Songs</p>
              <p class="text-gray-400 text-sm">Each band comes with AI-generated songs you can play</p>
            </div>
          </div>
        </div>

        <!-- Spotify Button -->
        <button
          @click="handleSpotifyAuth"
          :disabled="isLoading"
          class="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Music class="w-5 h-5" v-if="!isLoading" />
          <Loader class="w-5 h-5 animate-spin" v-if="isLoading" />
          <span>{{ isLoading ? 'Connecting...' : 'Continue with Spotify' }}</span>
        </button>

        <!-- Privacy Note -->
        <p class="text-xs text-gray-500 text-center mt-6">
          We only access your music preferences. We never post on your behalf.
        </p>

        <!-- Skip Auth Option -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <router-link 
            to="/" 
            class="block text-center text-gray-400 hover:text-white transition-colors"
          >
            Continue without Spotify →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { account, OAuthProvider } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { Check, Music, Loader } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)

const handleSpotifyAuth = async () => {
  try {
    isLoading.value = true
    
    // Use Appwrite's built-in OAuth2 session creation
    account.createOAuth2Session(
      OAuthProvider.Spotify,
      `${window.location.origin}/spotify-callback`, // success URL
      `${window.location.origin}/auth?error=true`, // failure URL
      ['user-read-private', 'user-read-email', 'user-top-read'] // Spotify scopes
    )
    
  } catch (error) {
    console.error('Spotify auth error:', error)
    isLoading.value = false
  }
}
</script>