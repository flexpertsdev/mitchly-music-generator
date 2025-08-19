<template>
  <div class="px-4 pb-8">
    <div class="max-w-2xl mx-auto">
      <!-- Mode Selection -->
      <div class="flex justify-center mb-6 sm:mb-8">
        <div class="bg-mitchly-gray p-1 rounded-full inline-flex border border-gray-700">
          <button
            @click="activeTab = 'simple'"
            :class="[
              'px-4 sm:px-6 py-2 rounded-full font-medium transition-all text-sm sm:text-base',
              activeTab === 'simple' 
                ? 'bg-mitchly-blue text-black font-semibold shadow-md' 
                : 'text-gray-400 hover:text-white'
            ]"
          >
            Simple
          </button>
          <button
            @click="activeTab = 'advanced'"
            :class="[
              'px-4 sm:px-6 py-2 rounded-full font-medium transition-all text-sm sm:text-base',
              activeTab === 'advanced' 
                ? 'bg-mitchly-blue text-black font-semibold shadow-md' 
                : 'text-gray-400 hover:text-white'
            ]"
          >
            Advanced
          </button>
        </div>
      </div>

      <!-- Simple Mode -->
      <div v-if="activeTab === 'simple'" class="fade-in">
        <div class="bg-mitchly-gray rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-800">
          <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-white">Create Your Musical Vision</h2>
          
          <div class="space-y-4 sm:space-y-6">
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-300">
                Describe Your Musical Concept
              </label>
              <textarea
                v-model="conceptText"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg sm:rounded-xl px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent h-32 sm:h-40 text-sm sm:text-base resize-none text-white placeholder-gray-500"
                placeholder="I'll create a comprehensive musical project combining Rihanna's pop sensibilities with blink-182's punk energy and NOFX's ska influences..."
              />
              <p class="text-gray-400 text-xs sm:text-sm mt-2">
                Describe your vision, influences, genre, themes, or any specific elements you want included.
              </p>
            </div>
            
            <button
              @click="handleGenerate"
              :disabled="isLoading || !conceptText.trim()"
              class="w-full py-3 sm:py-4 bg-mitchly-blue text-black font-bold text-base sm:text-lg rounded-lg sm:rounded-xl hover:bg-mitchly-blue/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              <Zap v-if="!isLoading" class="w-5 h-5" />
              <div v-else class="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              <span>{{ isLoading ? 'Generating...' : 'Generate Project' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Advanced Mode -->
      <div v-if="activeTab === 'advanced'" class="fade-in">
        <div class="bg-mitchly-gray rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-800">
          <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-white">Advanced Settings</h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label class="block text-sm font-medium mb-2">Band/Artist Name</label>
              <input
                type="text"
                v-model="formData.bandName"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
                placeholder="Enter your band name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Primary Genre</label>
              <select
                v-model="formData.genre"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
              >
                <option value="">Select Genre</option>
                <option value="Electronic">Electronic</option>
                <option value="Rock">Rock</option>
                <option value="Pop">Pop</option>
                <option value="Hip-Hop">Hip-Hop</option>
                <option value="Folk">Folk</option>
                <option value="Jazz">Jazz</option>
                <option value="Metal">Metal</option>
                <option value="R&B">R&B</option>
                <option value="Pop-Punk">Pop-Punk</option>
                <option value="Ska">Ska</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Album Name</label>
              <input
                type="text"
                v-model="formData.albumName"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
                placeholder="Enter album title"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Number of Tracks</label>
              <input
                type="number"
                min="3"
                max="15"
                v-model="formData.trackCount"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
              />
            </div>
            
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium mb-2">Musical Influences (comma-separated)</label>
              <input
                type="text"
                v-model="formData.influences"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
                placeholder="e.g., Daft Punk, The Weeknd, ODESZA"
              />
            </div>
            
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium mb-2">Lyrical Themes (comma-separated)</label>
              <input
                type="text"
                v-model="formData.themes"
                class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-sm sm:text-base text-white"
                placeholder="e.g., love, freedom, technology, dreams"
              />
            </div>
            
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium mb-2">Musical Concept Description</label>
              <textarea
                v-model="formData.concept"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent h-24 sm:h-32 text-sm sm:text-base resize-none"
                placeholder="Describe your vision for this musical project..."
              />
            </div>
          </div>
          
          <button
            @click="handleAdvancedGenerate"
            :disabled="isLoading || !formData.bandName || !formData.genre"
            class="w-full py-3 sm:py-4 bg-gradient-to-r from-mitchly-blue to-mitchly-purple text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
          >
            <Zap v-if="!isLoading" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{{ isLoading ? 'Generating...' : 'Generate Profile' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Zap } from 'lucide-vue-next'

export default {
  name: 'ConceptInput',
  components: {
    Zap
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['generate'],
  setup(props, { emit }) {
    const activeTab = ref('simple')
    const conceptText = ref('')
    const formData = ref({
      bandName: '',
      genre: '',
      albumName: '',
      trackCount: 8,
      influences: '',
      themes: '',
      concept: ''
    })

    const handleGenerate = () => {
      if (conceptText.value.trim()) {
        emit('generate', conceptText.value)
      }
    }

    const handleAdvancedGenerate = () => {
      const advancedConcept = `
Band: ${formData.value.bandName}
Genre: ${formData.value.genre}
Album: ${formData.value.albumName}
Track Count: ${formData.value.trackCount}
Influences: ${formData.value.influences}
Themes: ${formData.value.themes}
Concept: ${formData.value.concept}
      `.trim()
      
      emit('generate', advancedConcept)
    }

    return {
      activeTab,
      conceptText,
      formData,
      handleGenerate,
      handleAdvancedGenerate
    }
  }
}
</script>
