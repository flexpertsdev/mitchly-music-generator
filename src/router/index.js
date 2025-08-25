import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Views
import Home from '../views/Home.vue';
import BandPage from '../views/BandPage.vue';
import Gallery from '../views/Gallery.vue';
import Challenge from '../views/Challenge.vue';
import SpotifyAuth from '../views/SpotifyAuth.vue';
import SpotifyCallback from '../views/SpotifyCallbackSimple.vue';
import MyFavorites from '../views/MyFavorites.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/auth',
    name: 'SpotifyAuth',
    component: SpotifyAuth
  },
  {
    path: '/spotify-callback',
    name: 'SpotifyCallback',
    component: SpotifyCallback
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/challenge',
    name: 'Challenge',
    component: Challenge
  },
  {
    path: '/favorites',
    name: 'MyFavorites',
    component: MyFavorites,
    meta: { requiresAuth: true }
  },
  {
    path: '/band/:id',
    name: 'BandPage',
    component: BandPage,
    props: true
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/manage-bands',
    name: 'BandManagement',
    component: () => import('../views/BandManagement.vue'),
    meta: { requiresAuth: true }
  },
  // Commented out - views don't exist yet
  // {
  //   path: '/create',
  //   name: 'CreateContent',
  //   component: () => import('../views/CreateContent.vue'),
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/band/:id/edit',
  //   name: 'EditBand',
  //   component: () => import('../views/EditBand.vue'),
  //   meta: { requiresAuth: true },
  //   props: true
  // }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Skip auth check for callback route
  if (to.name === 'SpotifyCallback') {
    next();
    return;
  }
  
  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.init();
  }
  
  // Wait for loading to complete
  while (authStore.loading) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Route requires auth but user not authenticated, redirecting to /auth');
    next('/auth');
  } 
  // Check if route requires guest (not authenticated)
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('Route requires guest but user is authenticated, redirecting to /bands');
    next('/bands');
  } 
  else {
    next();
  }
});

export default router;
