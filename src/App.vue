<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- Main Content -->
    <main class="flex-1">
      <!-- Hero Section -->
      <div class="px-4 py-8 sm:py-12 text-center">
        <div class="max-w-4xl mx-auto">
          <!-- Logo -->
          <div class="mb-6 sm:mb-8 flex justify-center">
            <img 
              src="/logo.jpg" 
              alt="Mitchly Logo" 
              class="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-2xl ring-2 ring-white/10"
              style="border-radius: 22%;"
            />
          </div>
          
          <!-- Title -->
          <h1 class="hero-title font-bold mb-4 sm:mb-6 bg-gradient-to-r from-mitchly-blue to-mitchly-purple bg-clip-text text-transparent">
            Music Generator
          </h1>
          
          <!-- Tagline -->
          <p class="text-lg sm:text-xl text-gray-300 mb-3 sm:mb-4">
            Make More Than Just Music
          </p>
          
          <!-- Description -->
          <p class="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4">
            Create comprehensive band profiles and AI-optimized song content for platforms like Mureka.ai. 
            Generate complete albums with cohesive themes and copy-paste ready instructions.
          </p>
        </div>
      </div>

      <!-- Concept Input Section -->
      <ConceptInput 
        v-if="currentStep === 'concept'"
        @generate="handleGenerate"
        :isLoading="isGenerating"
      />

      <!-- Band Profile Section -->
      <BandProfile 
        v-if="currentStep === 'profile'"
        :profile="bandProfile"
        :songs="generatedSongs"
        @generateSong="handleGenerateSong"
        @generateAudio="handleGenerateAudio"
        @startOver="handleStartOver"
        :generatingSongIndex="generatingSongIndex"
      />
    </main>

    <!-- Footer -->
    <footer class="py-6 text-center text-gray-400 text-sm">
      <div class="max-w-4xl mx-auto px-4">
        © 2025 Mitchly. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script>
import { ref } from 'vue'
import ConceptInput from './components/ConceptInput.vue'
import BandProfile from './components/BandProfile.vue'
import { generateBandProfile, generateSong } from './services/anthropic.js'
import { generateAudio, pollAudioGeneration } from './services/mureka.js'
// import { songService, storageService } from './services/appwrite.js' // Uncomment when Appwrite is configured

export default {
  name: 'App',
  components: {
    ConceptInput,
    BandProfile
  },
  setup() {
    const currentStep = ref('concept')
    const isGenerating = ref(false)
    const generatingSongIndex = ref(null)
    const bandProfile = ref(null)
    const generatedSongs = ref([])

    const handleGenerate = async (conceptText) => {
      isGenerating.value = true
      
      try {
        const profile = await generateBandProfile(conceptText)
        bandProfile.value = profile
        
        // Initialize songs array
        const songs = profile.trackListing.map((title, index) => ({
          trackNumber: index + 1,
          title: title,
          artistDescription: profile.aiDescription,
          songDescription: "",
          lyrics: "",
          generated: false,
          audioStatus: null,
          audioProgress: null,
          audioUrl: null,
          murekaTaskId: null
        }))
        
        generatedSongs.value = songs
        currentStep.value = 'profile'
      } catch (error) {
        console.error('Generation error:', error)
        const errorMessage = error.message || 'An unexpected error occurred';
        
        // Show more user-friendly error message
        if (errorMessage.includes('API configuration')) {
          alert('Configuration Error: The API keys are not properly configured. Please check that all required environment variables are set in Netlify.');
        } else if (errorMessage.includes('500')) {
          alert('Server Error: The service is temporarily unavailable. Please try again in a moment.');
        } else {
          alert('Failed to generate band profile: ' + errorMessage);
        }
      } finally {
        isGenerating.value = false
      }
    }

    const handleGenerateSong = async (songIndex) => {
      generatingSongIndex.value = songIndex
      
      try {
        const song = generatedSongs.value[songIndex]
        const songData = await generateSong(song.title, song.trackNumber, bandProfile.value)
        
        const updatedSong = {
          ...song,
          songDescription: songData.songDescription,
          lyrics: songData.lyrics,
          generated: true
        }
        
        generatedSongs.value[songIndex] = updatedSong
      } catch (error) {
        console.error('Song generation error:', error)
        alert('Failed to generate song: ' + error.message)
      } finally {
        generatingSongIndex.value = null
      }
    }

    const handleGenerateAudio = async (songIndex) => {
      const song = generatedSongs.value[songIndex]
      
      if (!song.generated) {
        alert('Please generate the song lyrics first')
        return
      }
      
      try {
        // Update status to processing
        generatedSongs.value[songIndex] = {
          ...song,
          audioStatus: 'processing',
          audioProgress: 0
        }
        
        // Start audio generation
        const { taskId } = await generateAudio(
          song.title,
          song.songDescription,
          song.lyrics
        )
        
        // Save task ID
        generatedSongs.value[songIndex].murekaTaskId = taskId
        
        // Poll for completion
        const result = await pollAudioGeneration(taskId, (status) => {
          // Update progress
          if (status.progress) {
            generatedSongs.value[songIndex].audioProgress = status.progress
          }
        })
        
        if (result.audioUrl) {
          // For now, use the Mureka URL directly
          // In production with proper Appwrite setup, you would store it there
          generatedSongs.value[songIndex] = {
            ...generatedSongs.value[songIndex],
            audioStatus: 'completed',
            audioUrl: result.audioUrl,
            audioProgress: 100
          }
          
          // Optional: Try to save to Appwrite storage if available
          // Commented out until Appwrite storage buckets are configured
          /*
          try {
            const audioResponse = await fetch(result.audioUrl)
            const audioBlob = await audioResponse.blob()
            const audioFile = new File([audioBlob], `${song.title}.mp3`, { type: 'audio/mpeg' })
            const storedUrl = await storageService.uploadAudio(audioFile)
            generatedSongs.value[songIndex].audioUrl = storedUrl
          } catch (storageError) {
            console.warn('Could not store audio in Appwrite:', storageError)
          }
          */
        }
      } catch (error) {
        console.error('Audio generation error:', error)
        generatedSongs.value[songIndex] = {
          ...generatedSongs.value[songIndex],
          audioStatus: 'failed',
          audioProgress: null
        }
        alert('Failed to generate audio: ' + error.message)
      }
    }

    const handleStartOver = () => {
      currentStep.value = 'concept'
      bandProfile.value = null
      generatedSongs.value = []
      generatingSongIndex.value = null
    }

    return {
      currentStep,
      isGenerating,
      generatingSongIndex,
      bandProfile,
      generatedSongs,
      handleGenerate,
      handleGenerateSong,
      handleGenerateAudio,
      handleStartOver
    }
  }
}
</script>
