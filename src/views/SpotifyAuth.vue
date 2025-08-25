<template>
  <div class="min-h-screen bg-mitchly-dark flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-block">
          <img 
            src="/ic_launcher-web.png" 
            alt="Mitchly" 
            class="w-20 h-20 mx-auto rounded-2xl shadow-xl mb-4 hover:opacity-80 transition-opacity"
          />
        </router-link>
        <h1 class="text-2xl font-bold text-white mb-2">Welcome to Mitchly</h1>
        <p class="text-gray-400">Sign in to save favorites and sync your profile</p>
      </div>

      <!-- Error Message (if OAuth failed) -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Auth Container -->
      <div class="bg-mitchly-gray rounded-2xl p-6 border border-gray-800">
        <!-- Spotify Auth (Primary) -->
        <div class="space-y-4">
          <SpotifyAuthButton />
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-mitchly-gray text-gray-500">or continue with email</span>
            </div>
          </div>
          
          <!-- Email Auth (Fallback) -->
          <EmailAuthForm />
        </div>
      </div>

      <!-- Skip Auth Option -->
      <div class="text-center mt-6">
        <router-link 
          to="/"
          class="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Continue without signing in →
        </router-link>
        <p class="text-xs text-gray-500 mt-2">
          You can still browse, generate bands, and play music
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SpotifyAuthButton from '@/components/auth/SpotifyAuthButton.vue'
import EmailAuthForm from '@/components/auth/EmailAuthForm.vue'

const route = useRoute()
const errorMessage = ref('')

onMounted(() => {
  // Check for OAuth error in query params
  if (route.query.error) {
    try {
      // Try to parse the error if it's a JSON string
      const errorData = JSON.parse(decodeURIComponent(route.query.error))
      
      if (errorData.type === 'user_already_exists') {
        errorMessage.value = 'This account is already linked. Please try logging in instead.'
      } else {
        errorMessage.value = errorData.message || 'Authentication failed. Please try again.'
      }
    } catch {
      // If it's not JSON, just check if it's a boolean or string
      if (route.query.error === 'true' || route.query.error === 'spotify_failed') {
        errorMessage.value = 'Spotify authentication failed. Please try again or use email login.'
      }
    }
  }
})
</script>