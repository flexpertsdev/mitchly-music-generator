<template>
  <div class="stream-test min-h-screen bg-mitchly-dark p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-mitchly-blue mb-2">SSE Streaming Test</h1>
        <p class="text-gray-400">Testing real Server-Sent Events with Netlify Edge Functions</p>
        <router-link to="/" class="text-mitchly-blue hover:underline text-sm">← Back to Home</router-link>
      </div>

      <!-- Input Section -->
      <div class="bg-mitchly-gray rounded-xl p-6 mb-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Band Concept</label>
            <textarea
              v-model="prompt"
              class="w-full px-4 py-3 bg-mitchly-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mitchly-blue"
              rows="3"
              placeholder="Describe your band concept..."
            />
          </div>
          
          <button
            @click="testStreaming"
            :disabled="generating || !prompt"
            class="w-full py-3 px-6 bg-mitchly-blue text-white rounded-lg font-semibold hover:bg-mitchly-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ generating ? 'Generating...' : 'Test Streaming Generation' }}
          </button>
        </div>
      </div>

      <!-- Progress Display -->
      <div v-if="progressEvents.length > 0" class="bg-mitchly-gray rounded-xl p-6 mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">Progress Events</h3>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(event, index) in progressEvents"
            :key="index"
            class="p-3 bg-mitchly-dark rounded-lg"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">{{ event.timestamp }}</span>
              <span class="text-xs px-2 py-1 bg-mitchly-blue/20 text-mitchly-blue rounded">{{ event.type }}</span>
            </div>
            <p class="text-white mt-1">{{ event.message }}</p>
            <div v-if="event.progress" class="mt-2">
              <div class="w-full bg-mitchly-dark rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-mitchly-blue to-mitchly-purple h-full rounded-full transition-all duration-300"
                  :style="`width: ${event.progress}%`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Result Display -->
      <div v-if="result" class="bg-mitchly-gray rounded-xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Generated Band</h3>
        <pre class="text-xs text-gray-300 overflow-x-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-900/20 border border-red-500 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-red-400 mb-2">Error</h3>
        <p class="text-red-300">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// State
const prompt = ref('A progressive rock band inspired by Pink Floyd and Tool, exploring themes of consciousness and time');
const generating = ref(false);
const progressEvents = ref([]);
const result = ref(null);
const error = ref(null);

// Test streaming generation
const testStreaming = async () => {
  generating.value = true;
  progressEvents.value = [];
  result.value = null;
  error.value = null;

  try {
    // Create EventSource for SSE
    const eventSource = new EventSource(`/.netlify/edge-functions/generate-band-sse?prompt=${encodeURIComponent(prompt.value)}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      progressEvents.value.push({
        ...data,
        timestamp: new Date().toLocaleTimeString()
      });

      if (data.type === 'complete') {
        result.value = data.data;
        eventSource.close();
        generating.value = false;
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      error.value = 'Connection error occurred';
      eventSource.close();
      generating.value = false;
    };

  } catch (err) {
    console.error('Error:', err);
    error.value = err.message;
    generating.value = false;
  }
};
</script>

<style scoped>
.stream-test {
  font-family: 'Inter', sans-serif;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
