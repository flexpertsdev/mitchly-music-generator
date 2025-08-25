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
    <div class="container mx-auto px-6 py-8 max-w-6xl">
      <!-- Tab Navigation -->
      <div class="flex gap-4 mb-6 border-b border-gray-800">
        <button
          @click="activeTab = 'account'"
          :class="[
            'pb-3 px-1 font-medium transition-colors relative',
            activeTab === 'account' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Account
          <div v-if="activeTab === 'account'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-mitchly-blue"></div>
        </button>
        <button
          @click="activeTab = 'favorites'"
          :class="[
            'pb-3 px-1 font-medium transition-colors relative flex items-center gap-2',
            activeTab === 'favorites' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Favorites
          <span v-if="totalFavorites > 0" class="bg-mitchly-blue text-white text-xs px-2 py-0.5 rounded-full">
            {{ totalFavorites }}
          </span>
          <div v-if="activeTab === 'favorites'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-mitchly-blue"></div>
        </button>
      </div>

      <!-- Account Tab -->
      <div v-if="activeTab === 'account'" class="grid md:grid-cols-2 gap-6">
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
            
            <div v-if="userProfile?.prefs?.spotifyId">
              <p class="text-gray-400 text-sm mb-1">Connected Account</p>
              <div class="flex items-center gap-2">
                <Music class="w-4 h-4 text-[#1DB954]" />
                <span class="text-white">Spotify Connected</span>
              </div>
            </div>
            
            <div>
              <p class="text-gray-400 text-sm mb-1">Member Since</p>
              <p class="text-white">{{ formatDate(userProfile?.$createdAt) }}</p>
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

        <!-- Usage Statistics -->
        <div class="md:col-span-2 bg-mitchly-gray rounded-xl p-6 border border-gray-800">
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

      <!-- Favorites Tab -->
      <div v-else-if="activeTab === 'favorites'" id="favorites">
        <div class="space-y-6">
          <!-- Favorite Bands -->
          <div>
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users class="w-5 h-5 text-mitchly-purple" />
              Favorite Bands ({{ favoriteBandsList.length }})
            </h2>
            
            <div v-if="favoriteBandsList.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="bandId in favoriteBandsList"
                :key="bandId"
                @click="navigateToBand(bandId)"
                class="bg-mitchly-gray rounded-lg p-4 border border-gray-800 hover:border-mitchly-blue/50 cursor-pointer transition-all"
              >
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-mitchly-dark rounded-lg flex items-center justify-center">
                    <Users class="w-8 h-8 text-mitchly-purple" />
                  </div>
                  <div class="flex-1">
                    <p class="text-white font-medium">Band ID: {{ bandId.slice(0, 8) }}...</p>
                    <p class="text-gray-400 text-sm">Click to view</p>
                  </div>
                  <button
                    @click.stop="toggleBandFavorite(bandId)"
                    class="p-2 hover:bg-mitchly-dark/50 rounded-lg transition-all"
                  >
                    <Heart class="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-mitchly-gray rounded-lg p-8 border border-gray-800 text-center">
              <Heart class="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p class="text-gray-400">No favorite bands yet</p>
              <p class="text-gray-500 text-sm mt-1">Bands you like will appear here</p>
            </div>
          </div>

          <!-- Favorite Tracks -->
          <div>
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music class="w-5 h-5 text-mitchly-blue" />
              Favorite Tracks ({{ favoriteTracksList.length }})
            </h2>
            
            <div v-if="favoriteTracksList.length > 0" class="space-y-2">
              <div
                v-for="trackId in favoriteTracksList"
                :key="trackId"
                class="bg-mitchly-gray rounded-lg p-4 border border-gray-800 hover:border-mitchly-blue/50 transition-all"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-mitchly-dark rounded-lg flex items-center justify-center">
                    <Music class="w-6 h-6 text-mitchly-blue" />
                  </div>
                  <div class="flex-1">
                    <p class="text-white font-medium">Track ID: {{ trackId.slice(0, 8) }}...</p>
                    <p class="text-gray-400 text-sm">Saved track</p>
                  </div>
                  <button
                    @click="toggleTrackFavorite(trackId)"
                    class="p-2 hover:bg-mitchly-dark/50 rounded-lg transition-all"
                  >
                    <Heart class="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-mitchly-gray rounded-lg p-8 border border-gray-800 text-center">
              <Music class="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p class="text-gray-400">No favorite tracks yet</p>
              <p class="text-gray-500 text-sm mt-1">Tracks you like will appear here</p>
            </div>
          </div>

          <!-- Clear All Button -->
          <div v-if="totalFavorites > 0" class="flex justify-end">
            <button
              @click="handleClearFavorites"
              class="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 px-4 py-2"
            >
              <Trash2 class="w-4 h-4" />
              Clear All Favorites
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { account, databases, functions } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favoritesNew'
import { 
  ChevronLeft, 
  LogOut, 
  User, 
  CreditCard, 
  Music, 
  Check, 
  Sparkles, 
  BarChart,
  Heart,
  Users,
  Trash2
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const loading = ref(false)
const activeTab = ref('account')
const userProfile = ref(null)
const subscription = ref(null)
const stats = ref({
  bandsCreated: 0,
  songsGenerated: 0,
  audioGenerated: 0,
  totalPlays: 0
})

// Computed favorites
const favoriteBandsList = computed(() => favoritesStore.favoriteBandsList)
const favoriteTracksList = computed(() => favoritesStore.favoriteTracksList)
const totalFavorites = computed(() => favoritesStore.favoriteBandsCount + favoritesStore.favoriteTracksCount)

// Watch for hash in URL to switch to favorites tab
watch(() => route.hash, (newHash) => {
  if (newHash === '#favorites') {
    activeTab.value = 'favorites'
  }
}, { immediate: true })

onMounted(async () => {
  await loadUserProfile()
  await loadUsageStats()
  
  // Check if we should show favorites tab
  if (route.hash === '#favorites') {
    activeTab.value = 'favorites'
  }
})

const loadUserProfile = async () => {
  try {
    // Get user from auth store
    userProfile.value = authStore.user
    
    // For now, use default subscription
    subscription.value = { plan: 'free', status: 'inactive' }
  } catch (error) {
    console.error('Failed to load user profile:', error)
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

const navigateToBand = (bandId) => {
  router.push(`/band/${bandId}`)
}

const toggleBandFavorite = (bandId) => {
  favoritesStore.toggleBand(bandId)
}

const toggleTrackFavorite = (trackId) => {
  favoritesStore.toggleTrack(trackId)
}

const handleClearFavorites = () => {
  if (confirm('Are you sure you want to clear all favorites? This cannot be undone.')) {
    favoritesStore.clearAll()
  }
}

const handleUpgrade = async () => {
  loading.value = true
  try {
    // TODO: Integrate with existing Stripe function
    console.log('Opening Stripe checkout...')
    // For now, just log
    alert('Stripe integration coming soon!')
  } catch (error) {
    console.error('Failed to create checkout session:', error)
  } finally {
    loading.value = false
  }
}

const handleManageSubscription = async () => {
  loading.value = true
  try {
    // TODO: Integrate with existing Stripe function
    console.log('Opening Stripe portal...')
    alert('Stripe portal coming soon!')
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