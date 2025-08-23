<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
    <!-- Header -->
    <header class="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your AI Bands
          </h1>
          <div class="flex items-center space-x-4">
            <button @click="generateMoreBands" 
              class="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors">
              Generate More
            </button>
            <button @click="logout" 
              class="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-gray-400">Loading your bands...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="bands.length === 0" class="text-center py-20">
        <div class="max-w-md mx-auto">
          <svg class="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h2 class="text-2xl font-semibold text-white mb-2">No bands yet</h2>
          <p class="text-gray-400 mb-6">Let's create some AI bands based on your music taste!</p>
          <button @click="generateBands" 
            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Generate Your First Bands
          </button>
        </div>
      </div>

      <!-- Bands Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link v-for="band in bands" :key="band.$id" 
          :to="`/band/${band.$id}`"
          class="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300">
          
          <!-- Band Image -->
          <div class="aspect-square relative overflow-hidden">
            <img v-if="band.imageUrl" 
              :src="band.imageUrl" 
              :alt="band.bandName"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            <div v-else class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span class="text-white text-4xl font-bold">{{ band.bandName.charAt(0) }}</span>
            </div>
            
            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <!-- Band Info -->
          <div class="p-4">
            <h3 class="text-lg font-semibold text-white mb-1">{{ band.bandName }}</h3>
            <p class="text-sm text-gray-400 mb-2">{{ band.primaryGenre }}</p>
            
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ band.origin }}</span>
              <span class="text-xs text-gray-500">{{ band.formationYear }}</span>
            </div>

            <!-- Status indicator -->
            <div v-if="band.status === 'generating'" class="mt-3">
              <div class="text-xs text-purple-400 flex items-center">
                <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating content...
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { databases, Query, functions } from '@/lib/appwrite'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

const bands = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadBands()
})

const loadBands = async () => {
  try {
    loading.value = true
    const response = await databases.listDocuments(
      'main',
      'bands',
      [
        Query.equal('userId', authStore.userId),
        Query.orderDesc('$createdAt')
      ]
    )
    bands.value = response.documents
  } catch (error) {
    console.error('Error loading bands:', error)
    toast.error('Failed to load bands')
  } finally {
    loading.value = false
  }
}

const generateBands = async () => {
  try {
    toast.info('Generating your AI bands...')
    
    const response = await functions.createExecution(
      'generate-bands',
      JSON.stringify({
        userId: authStore.userId,
        count: 3
      })
    )

    const result = JSON.parse(response.responseBody)
    
    if (result.success) {
      toast.success('Bands generated successfully!')
      await loadBands()
    } else {
      throw new Error(result.error || 'Generation failed')
    }
  } catch (error) {
    console.error('Error generating bands:', error)
    toast.error('Failed to generate bands')
  }
}

const generateMoreBands = async () => {
  await generateBands()
}

const logout = async () => {
  await authStore.logout()
  router.push('/auth')
}
</script>
