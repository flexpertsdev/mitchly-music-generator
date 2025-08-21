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
      
      <!-- Input Section / Progress Display -->
      <div class="relative max-w-2xl mx-auto">
        <!-- Input Form - Hidden when generating -->
        <transition name="fade">
          <ConceptInput 
          v-if="!generating"
          @generate="handleGenerate"
          @bandCreated="handleBandCreated" 
            :loading="generating"
        />
        </transition>

        <!-- Progress section removed - now handled on band page -->
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
import { bandService, serviceStatus } from '../services/appwrite';
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
  appStatus.value = { ...serviceStatus };
  
  try {
    recentBands.value = await bandService.list(6);
    // Update status after successful load
    appStatus.value = { ...serviceStatus };
  } catch (error) {
    console.error('Error loading recent bands:', error);
    appStatus.value = { ...serviceStatus };
    
    // Show offline mode notification if Appwrite is unavailable
    if (!appStatus.value.isAvailable) {
      showToast('info', 'Offline Mode', 'Database unavailable - your data will be saved locally');
    }
  }
  
  // Check status periodically
  setInterval(() => {
    const newStatus = { ...serviceStatus };
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
  // Legacy handler for error cases
  if (data && data.error) {
    showToast('error', 'Failed to create band', data.error);
  }
};

const handleBandCreated = async (band) => {
  if (band && band.$id) {
    showToast('success', 'Band Created!', 'Redirecting to your band page...');
    
    // Navigate to band page immediately
    // The band page will handle showing generation progress
    setTimeout(() => {
      router.push(`/band/${band.$id}`);
    }, 500);
  }
};

const cancelGeneration = () => {
  // This is now handled on the band page
  generating.value = false;
  progressData.value = null;
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
/* Fade transitions for input/progress swap */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  position: absolute;
  width: 100%;
}

/* Toast transitions */
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