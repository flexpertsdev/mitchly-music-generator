<template>
  <div class="space-y-4">
    <!-- Toggle between Login and Register -->
    <div class="flex justify-center mb-4">
      <div class="bg-mitchly-gray p-1 rounded-full inline-flex border border-gray-700">
        <button
          @click="mode = 'login'"
          :class="[
            'px-6 py-2 rounded-full font-medium transition-all text-sm',
            mode === 'login' 
              ? 'bg-mitchly-blue text-white' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Login
        </button>
        <button
          @click="mode = 'register'"
          :class="[
            'px-6 py-2 rounded-full font-medium transition-all text-sm',
            mode === 'register' 
              ? 'bg-mitchly-blue text-white' 
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Register
        </button>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name field (register only) -->
      <div v-if="mode === 'register'">
        <label class="block text-sm font-medium mb-2 text-gray-300">
          Name
        </label>
        <input
          v-model="formData.name"
          type="text"
          required
          class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-white placeholder-gray-500"
          placeholder="Your name"
        />
      </div>

      <!-- Email field -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-300">
          Email
        </label>
        <input
          v-model="formData.email"
          type="email"
          required
          class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-white placeholder-gray-500"
          placeholder="your@email.com"
        />
      </div>

      <!-- Password field -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-300">
          Password
        </label>
        <input
          v-model="formData.password"
          type="password"
          required
          minlength="8"
          class="w-full bg-mitchly-dark border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-mitchly-blue focus:border-transparent text-white placeholder-gray-500"
          placeholder="••••••••"
        />
      </div>

      <!-- Error/Success message -->
      <div v-if="error" :class="[
        'rounded-lg p-3 text-sm',
        error.includes('successfully') || error.includes('created')
          ? 'bg-green-500/10 border border-green-500/50 text-green-400'
          : 'bg-red-500/10 border border-red-500/50 text-red-400'
      ]">
        {{ error }}
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-mitchly-blue hover:bg-mitchly-blue/80 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Mail class="w-5 h-5" />
        <span v-if="!loading">{{ mode === 'login' ? 'Login' : 'Create Account' }}</span>
        <span v-else>{{ mode === 'login' ? 'Logging in...' : 'Creating account...' }}</span>
      </button>
    </form>

    <!-- Note about no verification -->
    <p class="text-xs text-gray-500 text-center mt-4">
      No email verification required • Instant access
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Mail } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const mode = ref('login');
const loading = ref(false);
const error = ref('');

const formData = ref({
  name: '',
  email: '',
  password: ''
});

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    let result;
    
    if (mode.value === 'login') {
      console.log('Submitting login form...');
      result = await authStore.login(formData.value.email, formData.value.password);
    } else {
      console.log('Submitting registration form...');
      result = await authStore.register(
        formData.value.email, 
        formData.value.password, 
        formData.value.name
      );
    }

    if (result.success) {
      // Check for warning (registration successful but auto-login failed)
      if (result.warning) {
        // Show success message with instruction
        error.value = result.warning;
        // Switch to login mode so they can manually log in
        mode.value = 'login';
        // Pre-fill the email for convenience
        // Password is already there
      } else {
        // Success! Redirect to where they came from or profile
        const redirectTo = router.currentRoute.value.query.redirect || '/profile';
        console.log('Authentication successful, redirecting to:', redirectTo);
        router.push(redirectTo);
      }
    } else {
      error.value = result.error || 'Authentication failed. Please check your credentials.';
      console.error('Auth failed:', result.error);
    }
  } catch (err) {
    console.error('Unexpected auth error:', err);
    error.value = 'Connection error. Please check your internet and try again.';
  } finally {
    loading.value = false;
  }
};
</script>