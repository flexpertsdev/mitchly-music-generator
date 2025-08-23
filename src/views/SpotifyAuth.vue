<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center px-4 py-8">
    <!-- Background effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Mitchly
        </h1>
        <p class="text-gray-400 text-sm md:text-base">AI-Generated Bands from Your Music Taste</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700/50">
        <div class="space-y-6">
          <!-- Title -->
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-white mb-2">
              Connect Your Spotify
            </h2>
            <p class="text-gray-400 text-sm">
              We'll analyze your music taste to create unique AI bands just for you
            </p>
          </div>

          <!-- Features List -->
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-gray-300">Analyze your top artists and genres</p>
            </div>
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-gray-300">Generate AI bands based on your unique taste</p>
            </div>
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-gray-300">Discover new music tailored to you</p>
            </div>
          </div>

          <!-- Auth Button -->
          <button
            @click="handleSpotifyAuth"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            <svg v-if="!isLoading" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span v-if="isLoading">Connecting...</span>
            <span v-else>Continue with Spotify</span>
          </button>

          <!-- Privacy Note -->
          <p class="text-xs text-gray-500 text-center">
            We only access your music preferences. We never post on your behalf.
          </p>
        </div>
      </div>

      <!-- Alternative Auth -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-400">
          Don't have Spotify? 
          <router-link to="/guest" class="text-purple-400 hover:text-purple-300 transition-colors">
            Try as guest
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { account, OAuthProvider } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

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
    toast.error('Failed to connect to Spotify. Please try again.')
    isLoading.value = false
  }
}
</script>
