<template>
  <header class="bg-mitchly-darker border-b border-mitchly-gray sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6">
      <!-- Main Navigation Row -->
      <div class="flex items-center justify-between h-16">
        <!-- Left: Logo -->
        <router-link to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/ic_launcher-web.png" 
            alt="Mitchly" 
            class="w-10 h-10 rounded-lg"
          />
          <span class="hidden sm:block text-white font-bold text-lg">Mitchly</span>
        </router-link>

        <!-- Center: Page Title (Desktop Only) -->
        <h1 v-if="pageTitle" class="hidden md:block text-xl lg:text-2xl font-bold text-white">
          {{ pageTitle }}
        </h1>

        <!-- Right: User Menu -->
        <div class="flex items-center gap-3">
          <!-- Desktop User Menu -->
          <div class="hidden sm:block">
            <UserMenu v-if="isAuthenticated" />
            <router-link 
              v-else
              to="/auth"
              class="text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors hover:bg-mitchly-gray/50"
            >
              Sign In
            </router-link>
          </div>

          <!-- Mobile User Avatar (simplified) -->
          <div v-if="isAuthenticated" class="sm:hidden">
            <router-link to="/profile" class="block">
              <div class="w-8 h-8 bg-mitchly-blue rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-white" />
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Page Actions Row (Desktop) - Slot for page-specific actions -->
      <div v-if="$slots.actions" class="hidden sm:block border-t border-gray-800 py-3">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Mobile Page Title -->
    <div v-if="pageTitle" class="sm:hidden bg-mitchly-gray/50 border-t border-gray-800 px-4 py-2">
      <h1 class="text-base font-semibold text-white">{{ pageTitle }}</h1>
    </div>

    <!-- Mobile Page Actions -->
    <div v-if="$slots.actions" class="sm:hidden border-t border-gray-800 px-4 py-3">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import UserMenu from '@/components/auth/UserMenu.vue';
import { User } from 'lucide-vue-next';

// Props
defineProps({
  pageTitle: {
    type: String,
    default: ''
  }
});

// Store
const authStore = useAuthStore();

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<style scoped>
/* Keep header above bottom nav but below modals */
header {
  z-index: 40;
}
</style>