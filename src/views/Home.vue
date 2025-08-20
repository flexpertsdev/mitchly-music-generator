<template>
  <div class="home min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <header class="bg-mitchly-darker border-b border-mitchly-gray">
      <div class="container mx-auto px-6 py-4">
        <div class="flex justify-end">
          <router-link 
            to="/gallery"
            class="bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Music4 class="w-5 h-5" />
            Gallery
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto p-4 md:p-6">
      <!-- Mitchly Logo -->
      <div class="flex flex-col items-center mb-6 md:mb-8">
        <img 
          src="/ic_launcher-web.png" 
          alt="Mitchly" 
          class="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-2xl mb-3 md:mb-4"
        />
        <h1 class="text-2xl md:text-3xl font-bold text-mitchly-blue">Music Generator</h1>
        <p class="text-gray-400 mt-1 md:mt-2 text-sm md:text-base">Make more than music</p>
      </div>
      
      <!-- Input Section -->
      <ConceptInput 
        @generate="handleGenerate" 
        :loading="generating"
      />

      <!-- Progress Display -->
      <div v-if="generating && progressData" class="mt-8">
        <div class="max-w-2xl mx-auto bg-mitchly-gray rounded-xl p-6 border border-gray-800">
          <!-- Progress Bar -->
          <div class="mb-4">
            <div class="w-full bg-mitchly-dark rounded-full h-3 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-mitchly-blue to-mitchly-purple h-full transition-all duration-500 ease-out"
                :style="`width: ${progressData.progress}%`"
              />
            </div>
            <p class="text-sm text-gray-400 mt-2 text-center">{{ progressData.progress }}%</p>
          </div>
          
          <!-- Progress Message -->
          <div class="text-center">
            <p class="text-lg text-white font-medium animate-pulse">
              {{ progressData.message }}
            </p>
          </div>
          
          <!-- Progress Steps Visual -->
          <div class="mt-6 grid grid-cols-3 md:grid-cols-9 gap-2">
            <div 
              v-for="step in progressSteps" 
              :key="step.id"
              :class="[
                'text-center p-2 rounded-lg transition-all',
                progressData.progress >= step.minProgress 
                  ? 'bg-mitchly-blue/20 border border-mitchly-blue/40' 
                  : 'bg-mitchly-dark/50 border border-gray-700'
              ]"
            >
              <span class="text-lg md:text-2xl">{{ step.emoji }}</span>
              <p class="text-xs text-gray-400 mt-1 hidden md:block">{{ step.name }}</p>
            </div>
          </div>
        </div>
      </div>
  
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 space-y-2 z-50">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="`toast ${toast.type}`"
          class="bg-mitchly-gray border border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px]"
        >
          <div class="flex items-center gap-3">
            <component :is="getToastIcon(toast.type)" class="w-5 h-5" />
            <div class="flex-1">
              <p class="font-semibold text-white">{{ toast.title }}</p>
              <p class="text-sm text-gray-400">{{ toast.message }}</p>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ConceptInput from '../components/ConceptInput.vue';
import { generateBandProfileStream } from '../services/anthropic';
import { bandService, getAppwriteStatus } from '../services/appwrite';
import { 
  Music4, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-vue-next';

const router = useRouter();

// State
const generating = ref(false);
const progressData = ref(null);
const recentBands = ref([]);
const toasts = ref([]);
const appStatus = ref({ isAvailable: true, mode: 'online' });

// Progress steps for visual display
const progressSteps = [
  { id: 'concept', name: 'Concept', emoji: '🎸', minProgress: 0 },
  { id: 'identity', name: 'Identity', emoji: '🎤', minProgress: 20 },
  { id: 'story', name: 'Backstory', emoji: '📖', minProgress: 30 },
  { id: 'visual', name: 'Visuals', emoji: '🎨', minProgress: 40 },
  { id: 'album', name: 'Album', emoji: '💿', minProgress: 50 },
  { id: 'tracks', name: 'Tracks', emoji: '🎵', minProgress: 60 },
  { id: 'logo', name: 'Logo', emoji: '✨', minProgress: 70 },
  { id: 'photos', name: 'Photos', emoji: '📸', minProgress: 80 },
  { id: 'complete', name: 'Complete', emoji: '🎉', minProgress: 100 }
];

// Load recent bands on mount
onMounted(async () => {
  // Check app status
  appStatus.value = getAppwriteStatus();
  
  try {
    recentBands.value = await bandService.list(6);
    // Update status after successful load
    appStatus.value = getAppwriteStatus();
  } catch (error) {
    console.error('Error loading recent bands:', error);
    appStatus.value = getAppwriteStatus();
    
    // Show offline mode notification if Appwrite is unavailable
    if (!appStatus.value.isAvailable) {
      showToast('info', 'Offline Mode', 'Database unavailable - your data will be saved locally');
    }
  }
  
  // Check status periodically
  setInterval(() => {
    const newStatus = getAppwriteStatus();
    if (newStatus.isAvailable !== appStatus.value.isAvailable) {
      appStatus.value = newStatus;
      if (newStatus.isAvailable) {
        showToast('success', 'Back Online', 'Database connection restored');
      } else {
        showToast('info', 'Offline Mode', 'Database unavailable - data will be saved locally');
      }
    }
  }, 30000); // Check every 30 seconds
});

// Handlers
const handleGenerate = async (data) => {
  generating.value = true;
  progressData.value = { progress: 0, message: 'Starting...', step: 'start' };
  
  try {
    let prompt = data;
    let advancedData = null;
    
    // Check if data is an object (advanced mode)
    if (typeof data === 'object' && data.prompt) {
      prompt = data.prompt;
      advancedData = data.advancedData;
    }
    
    // Use streaming version with progress callback
    let generatedBand = null;
    
    try {
      generatedBand = await generateBandProfileStream(
        prompt, 
        advancedData,
        (progress) => {
          progressData.value = progress;
        }
      );
    } catch (error) {
      // Handle timeout errors (504) - the band might still have been created
      if (error.message.includes('504')) {
        console.log('Function timed out, checking if band was created...');
        progressData.value = { progress: 95, message: '⏳ Function timed out, checking results...', step: 'checking' };
        
        // Wait a bit then check recent bands
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // Get the most recent band
          const recentBands = await bandService.list(1);
          if (recentBands.length > 0) {
            const latestBand = recentBands[0];
            // Check if it was created recently (within last minute)
            const createdTime = new Date(latestBand.$createdAt).getTime();
            const now = Date.now();
            if (now - createdTime < 60000) { // Created within last minute
              generatedBand = latestBand;
              console.log('Found recently created band:', latestBand.$id);
            }
          }
        } catch (checkError) {
          console.error('Error checking for recent band:', checkError);
        }
      }
      
      // If not a timeout, re-throw the error
      if (!error.message.includes('504')) {
        throw error;
      }
    }
    
    if (generatedBand && generatedBand.$id) {
      showToast('success', 'Band Created!', 'Your band profile has been generated with visuals');
      
      // Small delay to show completion
      progressData.value = { progress: 100, message: '🎉 Band profile complete!', step: 'complete' };
      
      setTimeout(() => {
        router.push(`/band/${generatedBand.$id}`);
      }, 1000);
    } else {
      throw new Error('Band creation failed - unable to retrieve band data');
    }
  } catch (error) {
    console.error('Error generating band profile:', error);
    showToast('error', 'Generation Failed', error.message);
  } finally {
    generating.value = false;
    progressData.value = null;
  }
};

const showToast = (type, title, message) => {
  const id = Date.now();
  toasts.value.push({ id, type, title, message });
  
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }, 5000);
};

const getToastIcon = (type) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Loader
  };
  return icons[type] || AlertCircle;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.toast.success {
  border-left: 4px solid #00E4FF;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.warning {
  border-left: 4px solid #f59e0b;
}

.toast.info {
  border-left: 4px solid #8B5CF6;
}
</style>