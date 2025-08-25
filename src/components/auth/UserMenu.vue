<template>
  <div class="relative">
    <!-- User Avatar Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 bg-mitchly-gray hover:bg-mitchly-gray/80 px-3 py-2 rounded-lg transition-all"
    >
      <div class="w-8 h-8 bg-mitchly-blue rounded-full flex items-center justify-center">
        <User class="w-5 h-5 text-white" />
      </div>
      <span class="text-white text-sm font-medium hidden sm:block">
        {{ userName }}
      </span>
      <ChevronDown class="w-4 h-4 text-gray-400" />
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown">
      <div
        v-if="isOpen"
        v-click-outside="closeMenu"
        class="absolute right-0 mt-2 w-56 bg-mitchly-gray border border-gray-700 rounded-lg shadow-xl z-50"
      >
        <div class="p-3 border-b border-gray-700">
          <p class="text-white font-medium">{{ userName }}</p>
          <p class="text-gray-400 text-xs mt-1">{{ userEmail }}</p>
        </div>

        <div class="py-2">
          <router-link
            to="/profile"
            @click="isOpen = false"
            class="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-mitchly-dark/50 transition-all"
          >
            <User class="w-4 h-4" />
            <span>Profile</span>
          </router-link>

          <router-link
            to="/profile#favorites"
            @click="isOpen = false"
            class="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-mitchly-dark/50 transition-all"
          >
            <Heart class="w-4 h-4" />
            <span>My Favorites</span>
            <span v-if="totalFavorites > 0" class="ml-auto bg-mitchly-blue text-white text-xs px-2 py-0.5 rounded-full">
              {{ totalFavorites }}
            </span>
          </router-link>

          <button
            @click="handleSubscription"
            class="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-mitchly-dark/50 transition-all text-left"
          >
            <CreditCard class="w-4 h-4" />
            <span>Subscription</span>
            <span v-if="isPro" class="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
              PRO
            </span>
          </button>

          <div class="border-t border-gray-700 mt-2 pt-2">
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-mitchly-dark/50 transition-all text-left"
            >
              <LogOut class="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore } from '@/stores/favoritesNew';
import { functions } from '@/lib/appwrite';
import { User, ChevronDown, Heart, CreditCard, LogOut } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

const isOpen = ref(false);
const isPro = ref(false); // TODO: Check subscription status

const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || '');
const totalFavorites = computed(() => 
  favoritesStore.totalFavoritesCount
);

const closeMenu = () => {
  isOpen.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  isOpen.value = false;
  router.push('/');
};

const handleSubscription = async () => {
  // TODO: Integrate with existing Stripe function
  console.log('Opening subscription...');
  isOpen.value = false;
};

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  }
};
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>