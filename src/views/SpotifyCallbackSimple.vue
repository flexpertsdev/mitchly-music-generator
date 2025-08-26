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
      console.error('OAuth error in query params:', route.query.error)
      throw new Error('Authentication was cancelled or failed')
    }

    console.log('Spotify callback initiated, checking for session...')
    statusMessage.value = 'Getting your profile information...'
    
    // Try to get the current session with retries (OAuth may take a moment)
    let session = null
    let user = null
    let retries = 3
    
    while (retries > 0 && !session) {
      try {
        console.log(`Attempting to get session (${4 - retries}/3)...`)
        session = await account.getSession('current')
        console.log('Session found:', session)
        break
      } catch (err) {
        console.log('Session not ready yet, waiting...', err.message)
        retries--
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    if (!session) {
      console.error('No session found after OAuth redirect')
      throw new Error('Failed to establish session after authentication')
    }
    
    // Get the user account
    try {
      user = await account.get()
      console.log('User account retrieved:', user)
    } catch (err) {
      console.error('Failed to get user account:', err)
      throw new Error('Failed to retrieve user information')
    }
    
    // Store in auth store using the new setAuth method
    authStore.setAuth(user, session)
    console.log('Auth store updated successfully')
    
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
          name: user.name || '',
          spotifyId: session.providerUid || null,
          provider: session.provider || null,
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
          subscription: JSON.stringify({
            status: 'free',
            plan: 'free',
            customerId: null
          })
        }
      )
      console.log('User profile created successfully')
    } catch (error) {
      // If document already exists (409), update it
      if (error.code === 409) {
        console.log('User profile already exists, updating...')
        try {
          await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION,
            user.$id,
            {
              spotifyId: session.providerUid || null,
              provider: session.provider || null,
              lastLogin: new Date().toISOString()
            }
          )
          console.log('User profile updated successfully')
        } catch (updateError) {
          console.error('Failed to update user profile:', updateError)
          // Continue anyway - auth is successful even if profile update fails
        }
      } else {
        console.error('Failed to create user profile:', error)
        // Continue anyway - auth is successful even if profile creation fails
      }
    }
    
    statusMessage.value = 'Success! Redirecting...'
    
    setTimeout(() => {
      router.push('/gallery')
    }, 1000)
    
  } catch (error) {
    console.error('Spotify callback error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    })
    
    // Only redirect to auth if there's a real authentication failure
    if (error.message.includes('cancelled') || error.message.includes('failed')) {
      statusMessage.value = 'Authentication failed. Redirecting...'
      setTimeout(() => {
        router.push('/auth?error=spotify_failed')
      }, 2000)
    } else {
      // For other errors, still try to redirect to gallery if we have a user
      try {
        const currentUser = await account.get()
        if (currentUser) {
          console.log('User exists despite error, redirecting to gallery')
          statusMessage.value = 'Finalizing setup...'
          setTimeout(() => {
            router.push('/gallery')
          }, 1000)
        } else {
          throw new Error('No user found')
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError)
        statusMessage.value = 'Setup incomplete. Redirecting...'
        setTimeout(() => {
          router.push('/auth?error=setup_failed')
        }, 2000)
      }
    }
  } finally {
    loading.value = false
  }
})
</script>