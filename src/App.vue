<template>
  <div id="app">
    <!-- Main content area with padding for bottom nav on mobile -->
    <div class="min-h-screen pb-safe-mobile">
      <router-view />
    </div>
    
    <!-- Bottom Navigation (Mobile Only) -->
    <BottomNav />
  </div>
</template>

<script>
import BottomNav from '@/components/navigation/BottomNav.vue';

export default {
  name: 'App',
  components: {
    BottomNav
  }
}
</script>

<style>
/* Global styles for safe area and bottom nav spacing */
:root {
  --bottom-nav-height: 56px;
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
}

/* Add padding to main content on mobile to account for bottom nav */
@media (max-width: 767px) {
  .pb-safe-mobile {
    padding-bottom: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
  }
}

/* Ensure full height layout */
#app {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
}
</style>