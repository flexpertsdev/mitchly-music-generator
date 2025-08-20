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
    <div class="container mx-auto p-6">
      <!-- Mitchly Logo -->
      <div class="flex flex-col items-center mb-8">
        <img 
          src="/ic_launcher-web.png" 
          alt="Mitchly" 
          class="w-32 h-32 rounded-2xl shadow-2xl mb-4"
        />
        <h1 class="text-3xl font-bold text-mitchly-blue">Music Generator</h1>
        <p class="text-gray-400 mt-2">Make more than music</p>
      </div>
      
      <!-- Input Section -->
      <ConceptInput 
        @generate="handleGenerate" 
        :loading="generating"
      />

      <!-- Loading State -->
      <div v-if="generating" class="mt-8 flex items-center justify-center">
        <div class="text-center">
          <Loader class="w-12 h-12 text-mitchly-blue animate-spin mx-auto" />
          <p class="mt-4 text-gray-400">Generating your band profile...</p>
          <p class="mt-2 text-sm text-gray-500">This will take about 30 seconds...</p>
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
  
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ConceptInput from '../components/ConceptInput.vue';
import { generateBandProfile } from '../services/anthropic';
import { bandService, getAppwriteStatus } from '../services/appwrite';
import { falAIService } from '../services/falai';
import { storageService } from '../services/storage';
import { 
  Music, 
  Music4, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-vue-next';

const router = useRouter();

// State
const currentBandProfile = ref(null);
const generating = ref(false);
const recentBands = ref([]);
const toasts = ref([]);
const appStatus = ref({ isAvailable: true, mode: 'online' });

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
const handleGenerate = async (conceptText) => {
  generating.value = true;
  
  try {
    // Generate band profile
    currentBandProfile.value = await generateBandProfile(conceptText);
    showToast('success', 'Band Created!', 'Your band profile has been generated');
    
    // Generate images automatically
    showToast('info', 'Generating Visuals', 'Creating band logo, album cover, and band photo...');
    const images = await falAIService.generateAllBandImages(currentBandProfile.value);
    
    // Add generated image URLs to band profile
    if (images.logo || images.albumCover || images.bandPhoto) {
      currentBandProfile.value.logoUrl = images.logo;
      currentBandProfile.value.albumCoverUrl = images.albumCover;
      currentBandProfile.value.bandPhotoUrl = images.bandPhoto;
      showToast('success', 'Images Generated!', 'Visual assets created successfully');
    }
    
    // Auto-save the band and navigate to profile
    await saveBandAndNavigate();
  } catch (error) {
    console.error('Error generating band profile:', error);
    showToast('error', 'Generation Failed', error.message);
  } finally {
    generating.value = false;
  }
};


const saveBandAndNavigate = async () => {
  if (!currentBandProfile.value) return;
  
  try {
    // Create the band first
    const band = await bandService.create(currentBandProfile.value);
    
    // Upload images to Appwrite storage if they exist
    if (currentBandProfile.value.logoUrl || currentBandProfile.value.albumCoverUrl || currentBandProfile.value.bandPhotoUrl) {
      showToast('info', 'Uploading Images', 'Saving visual assets...');
      
      const uploadedImages = await storageService.uploadBandImages(band.$id, {
        logo: currentBandProfile.value.logoUrl,
        albumCover: currentBandProfile.value.albumCoverUrl,
        bandPhoto: currentBandProfile.value.bandPhotoUrl
      });
      
      // Update band with permanent image URLs
      if (uploadedImages.logoUrl || uploadedImages.albumCoverUrl || uploadedImages.bandPhotoUrl) {
        await bandService.update(band.$id, {
          logoUrl: uploadedImages.logoUrl || '',
          albumCoverUrl: uploadedImages.albumCoverUrl || '',
          bandPhotoUrl: uploadedImages.bandPhotoUrl || ''
        });
      }
    }
    
    showToast('success', 'Band Saved!', 'Navigating to band profile...');
    
    // Navigate to the band profile page
    setTimeout(() => {
      router.push(`/band/${band.$id}`);
    }, 500);
  } catch (error) {
    console.error('Error saving band:', error);
    showToast('error', 'Save Failed', error.message);
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