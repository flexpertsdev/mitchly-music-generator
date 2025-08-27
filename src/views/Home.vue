<template>
  <div class="landing-page min-h-screen bg-mitchly-dark">
    <!-- Header -->
    <AppHeader>
      <template #actions>
        <div class="flex items-center gap-3">
          <router-link 
            to="/gallery"
            class="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all"
          >
            Gallery
          </router-link>
          <router-link 
            to="/create"
            class="bg-mitchly-blue text-white hover:bg-mitchly-blue/80 px-4 py-2 rounded-lg transition-all shadow-lg"
          >
            Start Creating
          </router-link>
        </div>
      </template>
    </AppHeader>

    <!-- Hero Section - A Better Way For Music -->
    <section class="relative py-20 md:py-32 overflow-hidden">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Content -->
          <div class="z-10">
            <h1 class="text-5xl md:text-7xl font-bold mb-6">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-mitchly-purple to-mitchly-blue">
                A Better Way For
              </span>
              <br />
              <span class="text-white">Music</span>
            </h1>
            <p class="text-xl text-gray-300 mb-8 leading-relaxed">
              Mitchly connects artists directly with fans. No middlemen, no gatekeepers, just pure music appreciation.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <router-link 
                to="/create"
                class="bg-gradient-to-r from-mitchly-purple to-mitchly-blue text-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all text-center shadow-xl"
              >
                For Artists
              </router-link>
              <router-link 
                to="/gallery"
                class="bg-mitchly-cyan text-mitchly-dark font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all text-center shadow-xl"
              >
                For Fans
              </router-link>
            </div>
          </div>

          <!-- Concert Image/Visual -->
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-mitchly-purple/30 to-mitchly-blue/30 rounded-3xl blur-3xl"></div>
            <div class="relative bg-gradient-to-br from-mitchly-purple/20 to-mitchly-blue/20 rounded-3xl p-8 border border-gray-800">
              <div class="aspect-video bg-mitchly-gray rounded-xl flex items-center justify-center overflow-hidden">
                <div class="relative w-full h-full">
                  <!-- Animated gradient background -->
                  <div class="absolute inset-0 bg-gradient-to-tr from-mitchly-purple via-mitchly-blue to-mitchly-cyan opacity-50"></div>
                  <!-- Music visualization bars -->
                  <div class="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-2 p-8">
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 60px; animation-delay: 0ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 100px; animation-delay: 100ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 80px; animation-delay: 200ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 120px; animation-delay: 300ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 90px; animation-delay: 400ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 110px; animation-delay: 500ms;"></div>
                    <div class="w-3 bg-white/80 rounded-t animate-pulse" style="height: 70px; animation-delay: 600ms;"></div>
                  </div>
                </div>
              </div>
              <p class="text-center mt-4 text-gray-400">Direct artist-to-fan connection</p>
              <p class="text-center text-sm text-gray-500">Support the creators you love</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- For Musicians Section -->
    <section class="py-20 bg-mitchly-darker/50">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Visual -->
          <div class="order-2 lg:order-1">
            <div class="relative">
              <div class="absolute inset-0 bg-gradient-to-l from-mitchly-blue/30 to-purple-600/30 rounded-3xl blur-3xl"></div>
              <div class="relative bg-gradient-to-br from-mitchly-gray to-mitchly-darker rounded-3xl p-8 border border-gray-800">
                <div class="aspect-video bg-mitchly-dark rounded-xl flex items-center justify-center overflow-hidden">
                  <!-- Artist performing visualization -->
                  <div class="relative w-full h-full flex items-center justify-center">
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-mitchly-dark/80"></div>
                    <div class="relative z-10">
                      <div class="w-32 h-32 rounded-full bg-gradient-to-r from-mitchly-purple to-mitchly-blue flex items-center justify-center">
                        <Music class="w-16 h-16 text-white" />
                      </div>
                      <div class="absolute -top-4 -right-4 w-8 h-8 bg-mitchly-cyan rounded-full animate-ping"></div>
                      <div class="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500 rounded-full animate-ping" style="animation-delay: 500ms;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="order-1 lg:order-2">
            <span class="text-mitchly-cyan font-semibold text-sm uppercase tracking-wider">
              For Musicians & Producers
            </span>
            <h2 class="text-4xl md:text-5xl font-bold mt-4 mb-6">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-mitchly-purple to-mitchly-blue">
                Take Control of Your
              </span>
              <br />
              <span class="text-white">Music Career</span>
            </h2>
            <p class="text-lg text-gray-300 mb-8 leading-relaxed">
              Mitchly gives independent artists the tools to distribute music, build an audience, and earn a sustainable income.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <router-link 
                to="/auth"
                class="bg-gradient-to-r from-mitchly-purple to-purple-600 text-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all text-center shadow-xl"
              >
                Join as Artist
              </router-link>
              <router-link 
                to="/create"
                class="bg-mitchly-cyan text-mitchly-dark font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all text-center shadow-xl"
              >
                Demo Dashboard
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI Assistant Section -->
    <section class="py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-mitchly-dark via-mitchly-purple/10 to-mitchly-dark"></div>
      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-mitchly-purple to-mitchly-blue rounded-full mb-6">
            <Sparkles class="w-10 h-10 text-white" />
          </div>
          <h2 class="text-4xl md:text-5xl font-bold mb-6">
            <span class="text-white">Mitchly AI&R Assistant</span>
          </h2>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of music creation with our AI-powered band and song generator. 
            Create unique musical concepts, generate band identities, and produce complete albums in minutes.
          </p>
        </div>

        <!-- Feature Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <!-- Feature 1 -->
          <div class="bg-mitchly-gray/50 backdrop-blur rounded-xl p-6 border border-gray-800 hover:border-mitchly-purple transition-all">
            <div class="w-12 h-12 bg-mitchly-purple/20 rounded-lg flex items-center justify-center mb-4">
              <Zap class="w-6 h-6 text-mitchly-purple" />
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Instant Creation</h3>
            <p class="text-gray-400">Generate complete band profiles and music concepts with a single prompt</p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-mitchly-gray/50 backdrop-blur rounded-xl p-6 border border-gray-800 hover:border-mitchly-blue transition-all">
            <div class="w-12 h-12 bg-mitchly-blue/20 rounded-lg flex items-center justify-center mb-4">
              <Palette class="w-6 h-6 text-mitchly-blue" />
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Visual Identity</h3>
            <p class="text-gray-400">AI-generated logos, album covers, and band photos for complete branding</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-mitchly-gray/50 backdrop-blur rounded-xl p-6 border border-gray-800 hover:border-mitchly-cyan transition-all">
            <div class="w-12 h-12 bg-mitchly-cyan/20 rounded-lg flex items-center justify-center mb-4">
              <Users class="w-6 h-6 text-mitchly-cyan" />
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Community Driven</h3>
            <p class="text-gray-400">Share your creations, collaborate with others, and build your fanbase</p>
          </div>
        </div>

        <!-- CTA -->
        <div class="text-center mt-12">
          <router-link 
            to="/create"
            class="inline-flex items-center gap-2 bg-gradient-to-r from-mitchly-purple to-mitchly-blue text-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all shadow-xl"
          >
            <Sparkles class="w-5 h-5" />
            Try AI Generator Now
          </router-link>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-mitchly-darker/50">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-mitchly-purple mb-2">1000+</div>
            <p class="text-gray-400">Bands Created</p>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-mitchly-blue mb-2">5000+</div>
            <p class="text-gray-400">Songs Generated</p>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-mitchly-cyan mb-2">24/7</div>
            <p class="text-gray-400">AI Available</p>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-purple-500 mb-2">100%</div>
            <p class="text-gray-400">Free to Start</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-gray-800">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between">
          <div class="flex items-center gap-2 mb-4 md:mb-0">
            <img src="/ic_launcher-web.png" alt="Mitchly" class="w-8 h-8 rounded-lg" />
            <span class="text-white font-bold">Mitchly</span>
            <span class="text-gray-400 text-sm ml-2">© 2024 All rights reserved</span>
          </div>
          <div class="flex items-center gap-6">
            <a href="#" class="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" class="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Music, Sparkles, Zap, Palette, Users } from 'lucide-vue-next';
import AppHeader from '@/components/navigation/AppHeader.vue';
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    transform: scaleY(0.5);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>