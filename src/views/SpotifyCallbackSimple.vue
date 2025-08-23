<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center px-4 py-8">
    <!-- Background effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-md">
      <div class="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700/50">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4">
            <svg class="w-20 h-20 text-green-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          
          <h2 class="text-2xl font-semibold text-white mb-2">
            Setting Up Your Profile
          </h2>
          
          <p class="text-gray-400 mb-6">
            {{ statusMessage }}
          </p>

          <div v-if="loading" class="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
import { toast } from 'vue-sonner'

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
          onboardingCompleted: false
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
    
    // Now we can use the providerAccessToken to fetch Spotify data
    // For now, let's redirect to the bands page
    statusMessage.value = 'Success! Redirecting...'
    
    setTimeout(() => {
      toast.success('Successfully connected to Spotify!')
      router.push('/bands')
    }, 1000)
    
  } catch (error) {
    console.error('Spotify callback error:', error)
    toast.error(error.message || 'Failed to complete authentication')
    setTimeout(() => {
      router.push('/auth')
    }, 2000)
  } finally {
    loading.value = false
  }
})
</script>