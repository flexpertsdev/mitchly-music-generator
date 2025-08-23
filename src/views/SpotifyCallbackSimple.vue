<template>
  <div class="min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-center">
          <div class="flex items-center gap-3">
            <img 
              src="/ic_launcher-web.png" 
              alt="Mitchly" 
              class="w-10 h-10 rounded-lg"
            />
            <h1 class="text-2xl font-bold text-white">Mitchly</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-12 max-w-md">
      <div class="bg-mitchly-gray rounded-xl p-8 border border-gray-800">
        <div class="text-center">
          <!-- Spotify Icon with Animation -->
          <div class="w-20 h-20 mx-auto mb-6 relative">
            <div class="absolute inset-0 bg-[#1DB954]/20 rounded-full animate-ping"></div>
            <div class="relative w-20 h-20 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
              <Music class="w-10 h-10 text-[#1DB954]" />
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-white mb-2">
            Setting Up Your Profile
          </h2>
          
          <p class="text-gray-400 mb-6">
            {{ statusMessage }}
          </p>

          <div v-if="loading" class="w-8 h-8 mx-auto border-2 border-mitchly-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { account, databases, ID } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { Music } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const statusMessage = ref('Connecting to Spotify...')

onMounted(async () => {
  try {
    // Check if there's an error in the query params
    if (route.query.error) {
      throw new Error('Authentication was cancelled or failed')
    }

    statusMessage.value = 'Getting your profile information...'
    
    // Get the current session (which should now include Spotify OAuth data)
    const session = await account.getSession('current')
    
    // Get the user account
    const user = await account.get()
    
    // Store in auth store using the new setAuth method
    authStore.setAuth(user, session)
    
    // Wait a moment to ensure state is saved
    await new Promise(resolve => setTimeout(resolve, 100))
    
    statusMessage.value = 'Creating your music profile...'
    
    // Create or update user profile in database
    const DATABASE_ID = 'mitchly-music-db'
    const USERS_COLLECTION = 'users'
    
    try {
      // Try to create a user profile document
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION,
        user.$id,
        {
          userId: user.$id,
          email: user.email,
          name: user.name,
          spotifyId: session.providerUid,
          provider: session.provider,
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
          subscription: {
            status: 'free',
            plan: 'free',
            customerId: null
          }
        }
      )
    } catch (error) {
      // If document already exists, update it
      if (error.code === 409) {
        await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION,
          user.$id,
          {
            spotifyId: session.providerUid,
            provider: session.provider,
            lastLogin: new Date().toISOString()
          }
        )
      }
    }
    
    statusMessage.value = 'Success! Redirecting...'
    
    setTimeout(() => {
      router.push('/gallery')
    }, 1000)
    
  } catch (error) {
    console.error('Spotify callback error:', error)
    statusMessage.value = 'Authentication failed. Redirecting...'
    setTimeout(() => {
      router.push('/auth')
    }, 2000)
  } finally {
    loading.value = false
  }
})
</script>