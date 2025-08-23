<template>
  <div class="min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Back to Gallery -->
          <router-link to="/gallery" class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft class="w-5 h-5" />
            <span>Back to Gallery</span>
          </router-link>
          
          <!-- Title -->
          <h1 class="text-2xl font-bold text-white">Profile</h1>
          
          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <LogOut class="w-5 h-5" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8 max-w-4xl">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- User Info Card -->
        <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
          <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User class="w-5 h-5 text-mitchly-blue" />
            Account Information
          </h2>
          
          <div class="space-y-4">
            <div>
              <p class="text-gray-400 text-sm mb-1">Name</p>
              <p class="text-white">{{ userProfile?.name || 'Not set' }}</p>
            </div>
            
            <div>
              <p class="text-gray-400 text-sm mb-1">Email</p>
              <p class="text-white">{{ userProfile?.email || 'Not set' }}</p>
            </div>
            
            <div v-if="userProfile?.spotifyId">
              <p class="text-gray-400 text-sm mb-1">Connected Account</p>
              <div class="flex items-center gap-2">
                <Music class="w-4 h-4 text-[#1DB954]" />
                <span class="text-white">Spotify</span>
              </div>
            </div>
            
            <div>
              <p class="text-gray-400 text-sm mb-1">Member Since</p>
              <p class="text-white">{{ formatDate(userProfile?.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Subscription Card -->
        <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
          <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-mitchly-purple" />
            Subscription
          </h2>
          
          <!-- Current Plan -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-gray-400 text-sm mb-1">Current Plan</p>
                <p class="text-2xl font-bold text-white">
                  {{ subscription?.plan === 'pro' ? 'Pro' : 'Free' }}
                </p>
              </div>
              <div v-if="subscription?.plan === 'pro'" class="text-right">
                <p class="text-gray-400 text-sm mb-1">Renews</p>
                <p class="text-white">{{ formatDate(subscription?.renewsAt) }}</p>
              </div>
            </div>
            
            <!-- Plan Status Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                 :class="subscription?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'">
              <div class="w-2 h-2 rounded-full" 
                   :class="subscription?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></div>
              {{ subscription?.status === 'active' ? 'Active' : 'Inactive' }}
            </div>
          </div>
          
          <!-- Plan Features -->
          <div class="space-y-3 mb-6">
            <div class="flex items-start gap-3">
              <Check class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-white font-medium">Unlimited Band Generation</p>
                <p class="text-gray-400 text-sm">Create as many AI bands as you want</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <Check class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-white font-medium">High-Quality Audio</p>
                <p class="text-gray-400 text-sm">Generate songs with premium audio quality</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <Check class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-white font-medium">Priority Processing</p>
                <p class="text-gray-400 text-sm">Faster generation times for all content</p>
              </div>
            </div>
          </div>
          
          <!-- Upgrade/Manage Button -->
          <button
            v-if="subscription?.plan === 'free'"
            @click="handleUpgrade"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-mitchly-purple to-mitchly-blue hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles class="w-5 h-5" />
            Upgrade to Pro - $9.99/month
          </button>
          
          <button
            v-else
            @click="handleManageSubscription"
            :disabled="loading"
            class="w-full bg-mitchly-light-gray hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      <!-- Usage Statistics -->
      <div class="mt-6 bg-mitchly-gray rounded-xl p-6 border border-gray-800">
        <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart class="w-5 h-5 text-mitchly-blue" />
          Usage Statistics
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ stats.bandsCreated || 0 }}</p>
            <p class="text-gray-400 text-sm mt-1">Bands Created</p>
          </div>
          
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ stats.songsGenerated || 0 }}</p>
            <p class="text-gray-400 text-sm mt-1">Songs Generated</p>
          </div>
          
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ stats.audioGenerated || 0 }}</p>
            <p class="text-gray-400 text-sm mt-1">Audio Tracks</p>
          </div>
          
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ stats.totalPlays || 0 }}</p>
            <p class="text-gray-400 text-sm mt-1">Total Plays</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { account, databases, functions } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { 
  ChevronLeft, 
  LogOut, 
  User, 
  CreditCard, 
  Music, 
  Check, 
  Sparkles, 
  BarChart 
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const userProfile = ref(null)
const subscription = ref(null)
const stats = ref({
  bandsCreated: 0,
  songsGenerated: 0,
  audioGenerated: 0,
  totalPlays: 0
})

const DATABASE_ID = 'mitchly-music-db'
const USERS_COLLECTION = 'users'

onMounted(async () => {
  await loadUserProfile()
  await loadUsageStats()
})

const loadUserProfile = async () => {
  try {
    // Get user profile from database
    const user = authStore.user
    if (user) {
      const response = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION,
        user.$id
      )
      userProfile.value = response
      subscription.value = response.subscription || { plan: 'free', status: 'inactive' }
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
    // If document doesn't exist, use auth store data
    userProfile.value = authStore.user
    subscription.value = { plan: 'free', status: 'inactive' }
  }
}

const loadUsageStats = async () => {
  try {
    // Load usage statistics
    // This would query bands, songs, and audio collections
    // For now, using mock data
    stats.value = {
      bandsCreated: 3,
      songsGenerated: 12,
      audioGenerated: 8,
      totalPlays: 156
    }
  } catch (error) {
    console.error('Failed to load usage stats:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleUpgrade = async () => {
  loading.value = true
  try {
    // Create Stripe checkout session
    const response = await functions.createExecution(
      'create-checkout-session',
      JSON.stringify({
        userId: authStore.user.$id,
        priceId: 'price_1234567890', // Your Stripe price ID
        successUrl: `${window.location.origin}/profile?success=true`,
        cancelUrl: `${window.location.origin}/profile`
      })
    )
    
    const { checkoutUrl } = JSON.parse(response.responseBody)
    window.location.href = checkoutUrl
  } catch (error) {
    console.error('Failed to create checkout session:', error)
  } finally {
    loading.value = false
  }
}

const handleManageSubscription = async () => {
  loading.value = true
  try {
    // Create Stripe customer portal session
    const response = await functions.createExecution(
      'create-portal-session',
      JSON.stringify({
        userId: authStore.user.$id,
        returnUrl: `${window.location.origin}/profile`
      })
    )
    
    const { portalUrl } = JSON.parse(response.responseBody)
    window.location.href = portalUrl
  } catch (error) {
    console.error('Failed to create portal session:', error)
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>