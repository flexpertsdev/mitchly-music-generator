<template>
  <nav 
    v-if="isMobile"
    class="fixed bottom-0 left-0 right-0 bg-mitchly-darker border-t border-mitchly-gray z-50 md:hidden"
    :style="{ paddingBottom: `${safeAreaBottom}px` }"
  >
    <div class="relative flex items-center justify-around h-14">
      <!-- Home -->
      <router-link
        to="/"
        class="flex flex-col items-center justify-center gap-1 relative transition-colors flex-1"
        :class="isActive('/') ? 'text-mitchly-blue' : 'text-gray-400 hover:text-gray-300'"
      >
        <Home :class="['w-5 h-5', isActive('/') ? 'fill-current' : '']" />
        <span class="text-xs">Home</span>
      </router-link>

      <!-- Gallery -->
      <router-link
        to="/gallery"
        class="flex flex-col items-center justify-center gap-1 relative transition-colors flex-1"
        :class="isActive('/gallery') ? 'text-mitchly-blue' : 'text-gray-400 hover:text-gray-300'"
      >
        <Music2 :class="['w-5 h-5', isActive('/gallery') ? 'fill-current' : '']" />
        <span class="text-xs">Gallery</span>
      </router-link>

      <!-- Player Button (Centered) -->
      <button
        @click="handlePlayerClick"
        class="absolute left-1/2 -translate-x-1/2 -top-2 w-14 h-14 bg-gradient-to-br from-mitchly-blue to-mitchly-purple rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
      >
        <Play class="w-6 h-6 text-white fill-white ml-0.5" />
      </button>

      <!-- Favorites -->
      <router-link
        to="/favorites"
        class="flex flex-col items-center justify-center gap-1 relative transition-colors flex-1"
        :class="isActive('/favorites') ? 'text-mitchly-blue' : 'text-gray-400 hover:text-gray-300'"
      >
        <div class="relative">
          <Heart :class="['w-5 h-5', isActive('/favorites') ? 'fill-current' : '']" />
          <!-- Favorites Badge -->
          <span 
            v-if="totalFavorites > 0" 
            class="absolute -top-1 -right-2 bg-mitchly-purple text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-medium"
          >
            {{ totalFavorites > 99 ? '99+' : totalFavorites }}
          </span>
        </div>
        <span class="text-xs">Favorites</span>
      </router-link>

      <!-- Profile -->
      <router-link
        v-if="isAuthenticated"
        to="/profile"
        class="flex flex-col items-center justify-center gap-1 relative transition-colors flex-1"
        :class="isActive('/profile') ? 'text-mitchly-blue' : 'text-gray-400 hover:text-gray-300'"
      >
        <User :class="['w-5 h-5', isActive('/profile') ? 'fill-current' : '']" />
        <span class="text-xs">Profile</span>
      </router-link>
      
      <!-- Sign In (when not authenticated) -->
      <router-link
        v-else
        to="/auth"
        class="flex flex-col items-center justify-center gap-1 relative transition-colors flex-1"
        :class="isActive('/auth') ? 'text-mitchly-blue' : 'text-gray-400 hover:text-gray-300'"
      >
        <LogIn class="w-5 h-5" />
        <span class="text-xs">Sign In</span>
      </router-link>
    </div>

    <!-- iOS Home Indicator Safe Area -->
    <div class="h-safe-area-bottom bg-mitchly-darker"></div>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore } from '@/stores/favoritesNew';
import { Home, Music2, Heart, User, LogIn, Play } from 'lucide-vue-next';

const route = useRoute();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

// Mobile detection
const isMobile = ref(false);
const safeAreaBottom = ref(0);

// Check if current route is active
const isActive = (path) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
const totalFavorites = computed(() => favoritesStore.totalFavoritesCount);

// Handle player click
const handlePlayerClick = () => {
  // TODO: Open player modal or navigate to player page
  console.log('Player button clicked');
  // For now, you could emit an event or use a global state
  // to show a player modal
};

// Handle mobile detection and safe areas
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  
  // Check for iOS safe area
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const bottomPadding = computedStyle.getPropertyValue('--safe-area-bottom');
  if (bottomPadding) {
    safeAreaBottom.value = parseInt(bottomPadding) || 0;
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // Add CSS variable for safe areas if not present
  if (CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')) {
    document.documentElement.style.setProperty(
      '--safe-area-bottom',
      'env(safe-area-inset-bottom, 0px)'
    );
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
/* Ensure safe area padding works */
.h-safe-area-bottom {
  height: env(safe-area-inset-bottom, 0);
}

/* Add active indicator animation */
router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, #0D6FFF 0%, #7B3FFF 100%);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    width: 0;
  }
  to {
    width: 40%;
  }
}

/* Haptic feedback simulation on tap (iOS) */
@media (hover: none) {
  nav a:active {
    transform: scale(0.95);
    transition: transform 0.1s;
  }
}
</style>