<template>
  <div class="dashboard min-h-screen bg-mitchly-dark">
    <!-- Desktop Layout -->
    <div class="hidden lg:flex h-screen">
      <!-- Sidebar -->
      <div class="w-64 bg-mitchly-gray border-r border-gray-800 flex flex-col">
        <!-- Logo -->
        <div class="p-6 border-b border-gray-800">
          <div class="flex items-center gap-3">
            <img src="/ic_launcher-web.png" alt="Mitchly" class="w-10 h-10 rounded-lg" />
            <span class="text-white font-bold text-xl">Mitchly</span>
          </div>
        </div>

        <!-- Create Button -->
        <div class="p-4">
          <router-link 
            to="/create"
            class="w-full bg-gradient-to-r from-mitchly-purple to-mitchly-blue text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Plus class="w-5 h-5" />
            Create New Band
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4">
          <div class="space-y-1">
            <p class="text-gray-500 text-xs uppercase tracking-wider mt-4 mb-2">Browse</p>
            <button
              v-for="item in browseItems"
              :key="item.name"
              @click="activeView = item.view"
              :class="[
                'w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3',
                activeView === item.view 
                  ? 'bg-mitchly-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-mitchly-gray/50'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.name }}</span>
            </button>

            <p class="text-gray-500 text-xs uppercase tracking-wider mt-6 mb-2">Your Music</p>
            <button
              v-for="item in musicItems"
              :key="item.name"
              @click="activeView = item.view"
              :class="[
                'w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between',
                activeView === item.view 
                  ? 'bg-mitchly-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-mitchly-gray/50'
              ]"
            >
              <span>{{ item.name }}</span>
              <span v-if="item.count" class="bg-mitchly-blue/20 text-mitchly-cyan px-2 py-1 rounded-full text-xs">
                {{ item.count }}
              </span>
            </button>

            <p class="text-gray-500 text-xs uppercase tracking-wider mt-6 mb-2">Creator Studio</p>
            <button
              @click="activeView = 'studio'"
              :class="[
                'w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3',
                activeView === 'studio' 
                  ? 'bg-mitchly-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-mitchly-gray/50'
              ]"
            >
              <Settings class="w-5 h-5" />
              <span>Studio</span>
            </button>
          </div>
        </nav>

        <!-- Profile -->
        <div class="p-4 border-t border-gray-800">
          <button class="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-mitchly-gray/50 transition-all">
            Profile
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Discover View -->
        <div v-if="activeView === 'discover'" class="p-8">
          <!-- Hero Section -->
          <div class="bg-gradient-to-br from-mitchly-purple/30 to-mitchly-blue/30 rounded-3xl p-8 mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Discover Music</h1>
            <p class="text-xl text-gray-300">Explore new sounds and discover your next favorite band</p>
          </div>

          <!-- Filter Tabs -->
          <div class="flex gap-4 mb-8">
            <button
              v-for="tab in ['All Bands', 'Recent', 'Popular', 'Trending']"
              :key="tab"
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all',
                selectedTab === tab
                  ? 'bg-mitchly-blue text-white'
                  : 'bg-mitchly-gray text-gray-400 hover:text-white'
              ]"
              @click="selectedTab = tab"
            >
              {{ tab }}
            </button>
            <div class="ml-auto">
              <select class="bg-mitchly-gray text-white px-4 py-2 rounded-lg border border-gray-700">
                <option>Name</option>
                <option>Date Created</option>
                <option>Popularity</option>
              </select>
            </div>
          </div>

          <!-- Band Grid -->
          <div class="grid grid-cols-2 gap-6">
            <div
              v-for="band in sampleBands"
              :key="band.id"
              class="group cursor-pointer"
              @click="selectBand(band)"
            >
              <div class="relative aspect-square rounded-2xl overflow-hidden mb-4">
                <div :class="[
                  'absolute inset-0',
                  band.gradient
                ]"></div>
                <img 
                  v-if="band.image" 
                  :src="band.image" 
                  :alt="band.name"
                  class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                  <h3 class="text-2xl font-bold text-white mb-1">{{ band.bandName || band.name }}</h3>
                  <p class="text-gray-300">{{ band.primaryGenre || band.genre }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between px-2">
                <div class="flex items-center gap-4">
                  <span class="text-gray-400 text-sm">📅 {{ band.year }}</span>
                  <span class="text-gray-400 text-sm">📍 {{ band.location }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-mitchly-blue font-bold">{{ band.plays }} plays</span>
                  <div class="flex gap-1">
                    <Star v-for="i in 5" :key="i" :class="i <= band.rating ? 'text-yellow-500' : 'text-gray-600'" class="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- My Bands View -->
        <div v-if="activeView === 'mybands'" class="p-8">
          <div class="bg-gradient-to-br from-mitchly-cyan/30 to-mitchly-blue/30 rounded-3xl p-8 mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">My Bands</h1>
            <p class="text-xl text-gray-300">{{ userBands.length }} AI-generated bands in your collection</p>
          </div>

          <!-- Filter Tabs -->
          <div class="flex gap-4 mb-8">
            <button
              v-for="tab in ['All', 'Recent', 'Popular']"
              :key="tab"
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all',
                selectedTab === tab
                  ? 'bg-mitchly-blue text-white'
                  : 'bg-mitchly-gray text-gray-400 hover:text-white'
              ]"
              @click="selectedTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- User's Bands Grid -->
          <div class="grid grid-cols-2 gap-6">
            <div
              v-for="band in userBands"
              :key="band.id"
              class="group cursor-pointer"
            >
              <div class="relative aspect-square rounded-2xl overflow-hidden mb-4">
                <div :class="[
                  'absolute inset-0',
                  band.gradient
                ]"></div>
                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 class="text-2xl font-bold text-white mb-1">{{ band.name }}</h3>
                  <p class="text-gray-300">{{ band.genre }}</p>
                  <p class="text-gray-400 text-sm mt-2">AI Generated</p>
                </div>
              </div>
              <div class="flex items-center justify-between px-2">
                <span class="text-gray-400 text-sm">📅 {{ band.year }}</span>
                <div class="flex items-center gap-4">
                  <span class="text-mitchly-blue font-bold">{{ band.plays }} plays</span>
                  <div class="flex gap-1">
                    <Star v-for="i in 5" :key="i" :class="i <= band.rating ? 'text-yellow-500' : 'text-gray-600'" class="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Liked Bands View -->
        <div v-if="activeView === 'liked'" class="p-8">
          <div class="bg-gradient-to-br from-pink-600/30 to-mitchly-purple/30 rounded-3xl p-8 mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Your Favorites</h1>
            <p class="text-xl text-gray-300">{{ likedBands.length }} bands you love</p>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
              <div class="text-3xl font-bold text-pink-500 mb-2">12</div>
              <div class="text-gray-400">Liked Bands</div>
            </div>
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
              <div class="text-3xl font-bold text-mitchly-cyan mb-2">4.2K</div>
              <div class="text-gray-400">Total Plays</div>
            </div>
          </div>

          <!-- Recently Liked List -->
          <div class="space-y-1">
            <h2 class="text-xl font-bold text-white mb-4">Recently Liked</h2>
            <div
              v-for="band in likedBands"
              :key="band.id"
              class="bg-mitchly-gray rounded-lg p-4 flex items-center justify-between hover:bg-mitchly-gray/70 transition-all cursor-pointer"
            >
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-mitchly-purple to-mitchly-blue"></div>
                <div>
                  <h3 class="text-white font-bold">{{ band.name }}</h3>
                  <p class="text-gray-400 text-sm">{{ band.plays }} plays</p>
                </div>
              </div>
              <button class="text-gray-400 hover:text-white">
                <MoreHorizontal class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Creator Studio View -->
        <div v-if="activeView === 'studio'" class="p-8">
          <div class="bg-gradient-to-br from-mitchly-purple/30 to-mitchly-blue/30 rounded-3xl p-8 mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Creator Studio</h1>
            <p class="text-xl text-gray-300">Manage your music & fans</p>
          </div>

          <!-- User Type Toggle -->
          <div class="flex gap-4 mb-8 p-1 bg-mitchly-gray rounded-lg inline-flex">
            <button
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all',
                userType === 'creator'
                  ? 'bg-mitchly-blue text-white'
                  : 'text-gray-400'
              ]"
              @click="userType = 'creator'"
            >
              Creator
            </button>
            <button
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all',
                userType === 'fan'
                  ? 'bg-mitchly-blue text-white'
                  : 'text-gray-400'
              ]"
              @click="userType = 'fan'"
            >
              Fan/Subscriber
            </button>
          </div>

          <!-- Creator Stats -->
          <div v-if="userType === 'creator'" class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
              <div class="text-3xl font-bold text-mitchly-purple mb-2">8</div>
              <div class="text-gray-400">AI Bands Created</div>
            </div>
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
              <div class="text-3xl font-bold text-mitchly-cyan mb-2">156</div>
              <div class="text-gray-400">Subscribers</div>
            </div>
          </div>

          <!-- Creator Tools -->
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-white mb-4">Creator Tools</h2>
            
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 hover:border-mitchly-purple transition-all cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white mb-1">Create AI Band</h3>
                  <p class="text-gray-400">Generate new music with AI</p>
                </div>
                <ChevronRight class="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 hover:border-mitchly-purple transition-all cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white mb-1">Upload Real Music</h3>
                  <p class="text-gray-400">Share your original tracks</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">Pro</span>
                  <ChevronRight class="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 hover:border-mitchly-purple transition-all cursor-pointer">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white mb-1">Fan Engagement</h3>
                  <p class="text-gray-400">Messages, comments, analytics</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-xs font-bold">12</span>
                  <ChevronRight class="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 opacity-50">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white mb-1">Monetization</h3>
                  <p class="text-gray-400">Subscriptions, tips, merchandise</p>
                </div>
                <span class="text-gray-500 text-sm">Coming Soon</span>
              </div>
            </div>

            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 opacity-50">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white mb-1">License Management</h3>
                  <p class="text-gray-400">AI-generated licensing agreements</p>
                </div>
                <span class="text-gray-500 text-sm">Coming Soon</span>
              </div>
            </div>
          </div>

          <!-- Fan/Subscriber View -->
          <div v-if="userType === 'fan'" class="space-y-6">
            <div class="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
              <h3 class="text-lg font-bold text-white mb-2">Your Current Plan: Free</h3>
              <p class="text-gray-400 mb-4">Listen to unlimited music, but can't create bands</p>
              <button class="bg-gradient-to-r from-mitchly-purple to-pink-600 text-white font-bold px-6 py-2 rounded-lg">
                Upgrade to Fan+
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800">
                <h4 class="font-bold text-white mb-2">Fan+ ($9.99/mo)</h4>
                <ul class="text-sm text-gray-400 space-y-1">
                  <li>✓ Create 1 band per month</li>
                  <li>✓ Generate 1 album monthly</li>
                  <li>✓ Support artists with $4 fan pass</li>
                  <li>✓ 30-day free trial</li>
                </ul>
              </div>
              <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800">
                <h4 class="font-bold text-white mb-2">Premium ($19.99/mo)</h4>
                <ul class="text-sm text-gray-400 space-y-1">
                  <li>✓ Create 3 bands per month</li>
                  <li>✓ Generate 3 albums monthly</li>
                  <li>✓ Priority support</li>
                  <li>✓ Early access features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Challenge View -->
        <div v-if="activeView === 'challenge'" class="p-8">
          <div class="bg-gradient-to-br from-mitchly-purple/30 to-pink-600/30 rounded-3xl p-8 mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Mitchly Challenge</h1>
            <p class="text-xl text-gray-300">Test your music knowledge and win prizes</p>
          </div>
          
          <div class="bg-mitchly-gray rounded-xl p-8 border border-gray-800 text-center">
            <Trophy class="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 class="text-2xl font-bold text-white mb-2">Weekly Challenge</h3>
            <p class="text-gray-400 mb-6">Guess the AI-generated band from their description</p>
            <router-link 
              to="/challenge"
              class="inline-flex items-center gap-2 bg-gradient-to-r from-mitchly-purple to-pink-600 text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-all"
            >
              Play Now
              <ArrowRight class="w-5 h-5" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Now Playing Sidebar -->
      <div class="w-96 bg-mitchly-gray border-l border-gray-800 p-6">
        <h2 class="text-lg font-bold text-white mb-6">Now Playing</h2>
        
        <!-- Album Art -->
        <div class="aspect-square rounded-2xl mb-6 relative overflow-hidden">
          <div v-if="playerStore.currentAlbum?.coverUrl" class="w-full h-full">
            <img 
              :src="playerStore.currentAlbum.coverUrl" 
              :alt="playerStore.currentAlbum.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-else class="w-full h-full bg-gradient-to-br from-mitchly-purple to-mitchly-blue flex items-center justify-center">
            <Music class="w-24 h-24 text-white/30" />
          </div>
        </div>

        <!-- Track Info -->
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-white mb-1">
            {{ playerStore.currentTrack?.title || 'No track playing' }}
          </h3>
          <p class="text-gray-400">
            {{ playerStore.currentBand?.bandName || 'Select a band to play' }}
          </p>
        </div>

        <!-- Audio Player Integration -->
        <div v-if="playerStore.currentTrack" class="mb-6">
          <AudioPlayer 
            :audioUrl="playerStore.currentTrack.audioUrl"
            :title="playerStore.currentTrack.title"
            :autoplay="false"
            @play="playerStore.play()"
            @pause="playerStore.pause()"
            @ended="playerStore.playNext()"
          />
        </div>
        <div v-else class="mb-6">
          <!-- Empty State Progress Bar -->
          <div class="flex justify-between text-xs text-gray-400 mb-2">
            <span>0:00</span>
            <span>0:00</span>
          </div>
          <div class="bg-mitchly-dark rounded-full h-1">
            <div class="bg-mitchly-cyan h-full rounded-full" style="width: 0%"></div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <button 
            @click="playerStore.playPrevious()"
            :disabled="!playerStore.hasPrevious"
            class="text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <SkipBack class="w-6 h-6" />
          </button>
          <button 
            @click="playerStore.togglePlayPause()"
            class="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-all"
          >
            <component 
              :is="playerStore.isPlaying ? Pause : Play" 
              class="w-6 h-6 text-mitchly-dark"
              :class="{ 'ml-1': !playerStore.isPlaying }"
            />
          </button>
          <button 
            @click="playerStore.playNext()"
            :disabled="!playerStore.hasNext"
            class="text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <SkipForward class="w-6 h-6" />
          </button>
        </div>

        <!-- Up Next -->
        <div>
          <h4 class="text-sm font-bold text-gray-400 mb-4">
            Up Next ({{ playerStore.playlist.length }} tracks)
          </h4>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div 
              v-for="(track, index) in playerStore.playlist.slice(playerStore.currentIndex + 1, playerStore.currentIndex + 6)" 
              :key="track.$id || index"
              @click="playTrackAtIndex(playerStore.playlist.indexOf(track))"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-mitchly-dark transition-all cursor-pointer"
            >
              <div class="w-12 h-12 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Music class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <p class="text-white text-sm font-medium">{{ track.title }}</p>
                <p class="text-gray-500 text-xs">Track {{ track.trackNumber }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden">
      <!-- Mobile Header -->
      <AppHeader pageTitle="Dashboard" />

      <!-- Mobile Content -->
      <div class="pb-20">
        <!-- Spotify Connect Banner (Mobile) -->
        <div v-if="!spotifyConnected" class="p-4">
          <div class="bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-xl p-4 border border-green-500/30">
            <div class="flex items-center gap-3 mb-3">
              <Music4 class="w-6 h-6 text-green-500" />
              <h3 class="font-bold text-white">Connect Spotify</h3>
            </div>
            <p class="text-sm text-gray-300 mb-3">Discover your new favorite band based on your music taste</p>
            <button class="w-full bg-green-600 text-white font-bold py-2 rounded-lg">
              Connect Now
            </button>
          </div>
        </div>

        <!-- Challenge Card (Mobile) -->
        <div class="p-4">
          <div class="bg-gradient-to-r from-mitchly-purple/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-white">Weekly Challenge</h3>
              <Trophy class="w-5 h-5 text-yellow-500" />
            </div>
            <p class="text-sm text-gray-300 mb-3">Test your music knowledge</p>
            <router-link 
              to="/challenge"
              class="block w-full bg-mitchly-purple text-white font-bold py-2 rounded-lg text-center"
            >
              Play Now
            </router-link>
          </div>
        </div>

        <!-- Mobile View Content -->
        <div v-if="mobileView === 'home'" class="p-4">
          <h2 class="text-2xl font-bold text-white mb-4">Your Music</h2>
          
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800">
              <div class="text-2xl font-bold text-mitchly-purple">{{ userBands.length }}</div>
              <div class="text-sm text-gray-400">My Bands</div>
            </div>
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800">
              <div class="text-2xl font-bold text-mitchly-cyan">{{ likedBands.length }}</div>
              <div class="text-sm text-gray-400">Liked</div>
            </div>
          </div>

          <!-- Recent Bands -->
          <h3 class="text-lg font-bold text-white mb-3">Recently Created</h3>
          <div class="space-y-3">
            <div
              v-for="band in userBands.slice(0, 3)"
              :key="band.id"
              class="bg-mitchly-gray rounded-lg p-3 flex items-center gap-3"
              @click="showMobilePlayer = true"
            >
              <div class="w-14 h-14 rounded-lg" :class="band.gradient"></div>
              <div class="flex-1">
                <p class="text-white font-medium">{{ band.name }}</p>
                <p class="text-gray-400 text-sm">{{ band.genre }}</p>
              </div>
              <Play class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        <!-- Gallery View (Mobile) -->
        <div v-if="mobileView === 'gallery'" class="p-4">
          <h2 class="text-2xl font-bold text-white mb-4">Discover</h2>
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="band in sampleBands.slice(0, 4)"
              :key="band.id"
              class="cursor-pointer"
              @click="showMobilePlayer = true"
            >
              <div class="aspect-square rounded-xl overflow-hidden mb-2" :class="band.gradient"></div>
              <p class="text-white font-medium text-sm">{{ band.name }}</p>
              <p class="text-gray-400 text-xs">{{ band.genre }}</p>
            </div>
          </div>
        </div>

        <!-- Create View (Mobile) -->
        <div v-if="mobileView === 'create'" class="p-4">
          <div class="text-center py-8">
            <div class="w-20 h-20 bg-gradient-to-br from-mitchly-purple to-mitchly-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus class="w-10 h-10 text-white" />
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Create New Band</h2>
            <p class="text-gray-400 mb-6">Generate unique AI music</p>
            <router-link
              to="/create"
              class="inline-block bg-mitchly-blue text-white font-bold px-8 py-3 rounded-lg"
            >
              Start Creating
            </router-link>
          </div>
        </div>

        <!-- Profile View (Mobile) -->
        <div v-if="mobileView === 'profile'" class="p-4">
          <h2 class="text-2xl font-bold text-white mb-4">Profile</h2>
          
          <!-- User Info -->
          <div class="bg-mitchly-gray rounded-xl p-4 mb-4 flex items-center gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-mitchly-purple to-mitchly-blue rounded-full"></div>
            <div>
              <p class="text-white font-bold">{{ userProfile.name }}</p>
              <p class="text-gray-400 text-sm">{{ userProfile.plan }} Plan</p>
            </div>
          </div>

          <!-- Plan Info -->
          <div class="bg-mitchly-gray rounded-xl p-4 mb-4">
            <h3 class="font-bold text-white mb-2">Your Plan</h3>
            <p class="text-gray-400 text-sm mb-3">{{ planDetails[userProfile.plan] }}</p>
            <button class="w-full bg-mitchly-purple text-white font-bold py-2 rounded-lg">
              Upgrade Plan
            </button>
          </div>

          <!-- Settings -->
          <div class="space-y-2">
            <button class="w-full bg-mitchly-gray rounded-lg p-3 text-left text-white">
              Account Settings
            </button>
            <button class="w-full bg-mitchly-gray rounded-lg p-3 text-left text-white">
              Subscription
            </button>
            <button class="w-full bg-mitchly-gray rounded-lg p-3 text-left text-red-400">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Bottom Navigation -->
      <div class="fixed bottom-0 left-0 right-0 bg-mitchly-gray border-t border-gray-800 px-4 py-2 z-40">
        <div class="flex items-center justify-around">
          <button
            @click="mobileView = 'home'"
            :class="[
              'flex flex-col items-center gap-1 p-2',
              mobileView === 'home' ? 'text-mitchly-cyan' : 'text-gray-400'
            ]"
          >
            <Home class="w-5 h-5" />
            <span class="text-xs">Home</span>
          </button>

          <button
            @click="mobileView = 'gallery'"
            :class="[
              'flex flex-col items-center gap-1 p-2',
              mobileView === 'gallery' ? 'text-mitchly-cyan' : 'text-gray-400'
            ]"
          >
            <Grid3x3 class="w-5 h-5" />
            <span class="text-xs">Gallery</span>
          </button>

          <!-- Center Play Button -->
          <button
            @click="showMobilePlayer = true"
            class="relative -mt-4 w-14 h-14 bg-gradient-to-r from-mitchly-purple to-mitchly-blue rounded-full flex items-center justify-center shadow-lg"
          >
            <component 
              :is="playerStore.isPlaying ? Pause : Play" 
              class="w-6 h-6 text-white"
              :class="{ 'ml-1': !playerStore.isPlaying }"
            />
          </button>

          <button
            @click="mobileView = 'create'"
            :class="[
              'flex flex-col items-center gap-1 p-2',
              mobileView === 'create' ? 'text-mitchly-cyan' : 'text-gray-400'
            ]"
          >
            <Plus class="w-5 h-5" />
            <span class="text-xs">Create</span>
          </button>

          <button
            @click="mobileView = 'profile'"
            :class="[
              'flex flex-col items-center gap-1 p-2',
              mobileView === 'profile' ? 'text-mitchly-cyan' : 'text-gray-400'
            ]"
          >
            <User class="w-5 h-5" />
            <span class="text-xs">Profile</span>
          </button>
        </div>
      </div>

      <!-- Mobile Full Screen Player -->
      <transition name="slide-up">
        <div v-if="showMobilePlayer" class="fixed inset-0 bg-mitchly-dark z-50">
          <div class="h-full flex flex-col">
            <!-- Player Header -->
            <div class="flex items-center justify-between p-4">
              <button @click="showMobilePlayer = false">
                <ChevronDown class="w-6 h-6 text-white" />
              </button>
              <p class="text-white font-medium">Now Playing</p>
              <button>
                <MoreVertical class="w-6 h-6 text-white" />
              </button>
            </div>

            <!-- Album Art -->
            <div class="flex-1 flex items-center justify-center px-8">
              <div class="w-full max-w-sm aspect-square rounded-2xl overflow-hidden">
                <div v-if="playerStore.currentAlbum?.coverUrl" class="w-full h-full">
                  <img 
                    :src="playerStore.currentAlbum.coverUrl" 
                    :alt="playerStore.currentAlbum.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-full h-full bg-gradient-to-br from-mitchly-purple to-mitchly-blue flex items-center justify-center">
                  <Music class="w-24 h-24 text-white/30" />
                </div>
              </div>
            </div>

            <!-- Track Info -->
            <div class="px-8 py-4">
              <h3 class="text-2xl font-bold text-white mb-1">
                {{ playerStore.currentTrack?.title || 'No track playing' }}
              </h3>
              <p class="text-gray-400">
                {{ playerStore.currentBand?.bandName || 'Select a track' }}
              </p>
            </div>

            <!-- Audio Player Component for Mobile -->
            <div class="px-8 pb-4">
              <AudioPlayer 
                v-if="playerStore.currentTrack"
                :audioUrl="playerStore.currentTrack.audioUrl"
                :title="playerStore.currentTrack.title"
                :autoplay="false"
                @play="playerStore.play()"
                @pause="playerStore.pause()"
                @ended="playerStore.playNext()"
              />
              <div v-else>
                <div class="bg-mitchly-gray rounded-full h-1 mb-2">
                  <div class="bg-mitchly-cyan h-full rounded-full" style="width: 0%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400">
                  <span>0:00</span>
                  <span>0:00</span>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-8 pb-8">
              <button 
                @click="playerStore.playPrevious()"
                :disabled="!playerStore.hasPrevious"
                class="text-white disabled:opacity-50"
              >
                <SkipBack class="w-8 h-8" />
              </button>
              <button 
                @click="playerStore.togglePlayPause()"
                class="w-20 h-20 bg-white rounded-full flex items-center justify-center"
              >
                <component 
                  :is="playerStore.isPlaying ? Pause : Play" 
                  class="w-8 h-8 text-mitchly-dark"
                  :class="{ 'ml-1': !playerStore.isPlaying }"
                />
              </button>
              <button 
                @click="playerStore.playNext()"
                :disabled="!playerStore.hasNext"
                class="text-white disabled:opacity-50"
              >
                <SkipForward class="w-8 h-8" />
              </button>
            </div>

            <!-- Queue -->
            <div class="bg-mitchly-gray rounded-t-3xl p-6">
              <h4 class="text-white font-bold mb-3">Up Next</h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div 
                  v-for="(track, index) in playerStore.playlist.slice(playerStore.currentIndex + 1)" 
                  :key="track.$id || index"
                  @click="playTrackAtIndex(playerStore.playlist.indexOf(track))"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-mitchly-dark cursor-pointer"
                >
                  <div class="w-12 h-12 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Music class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p class="text-white">{{ track.title }}</p>
                    <p class="text-gray-400 text-sm">Track {{ track.trackNumber }}</p>
                  </div>
                </div>
                <div v-if="playerStore.playlist.length === 0" class="text-gray-400 text-center py-4">
                  No tracks in queue
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { bandService, albumService, songService } from '@/services/appwrite/database'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { 
  Home, Grid3x3, Plus, User, Play, Pause, SkipBack, SkipForward,
  ChevronDown, MoreVertical, Music, Music4, Star, Settings,
  ChevronRight, MoreHorizontal, Trophy, ArrowRight, Shuffle, Repeat, Volume2
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

// State
const activeView = ref('discover')
const mobileView = ref('home')
const selectedTab = ref('All Bands')
const userType = ref('creator')
const showMobilePlayer = ref(false)
const spotifyConnected = ref(false)
const isLoading = ref(false)
const loadingError = ref(null)

// User data
const userProfile = ref({
  name: 'Music Creator',
  plan: 'Free',
  bandsCreated: 8,
  subscribers: 156
})

const planDetails = {
  'Free': 'Listen unlimited, no band creation',
  'Fan+': '1 band/month, support artists',
  'Premium': '3 bands/month, priority features',
  'Creator': 'Unlimited AI generation',
  'Artist': 'Upload music, build fanbase'
}

// Real data from database
const sampleBands = ref([])
const userBands = ref([])
const likedBands = ref([])
const currentPlaylist = ref([])

// Color gradients for bands without images
const gradients = [
  'bg-gradient-to-br from-purple-600 to-pink-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-green-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-indigo-500 to-purple-600',
  'bg-gradient-to-br from-yellow-500 to-orange-600'
]

const browseItems = [
  { name: 'Discover', icon: Music4, view: 'discover' },
  { name: 'Library', icon: Grid3x3, view: 'library' },
  { name: 'Trending', icon: Trophy, view: 'trending' },
  { name: 'Challenge', icon: Trophy, view: 'challenge' }
]

const musicItems = [
  { name: 'My Bands', count: 24, view: 'mybands' },
  { name: 'Liked Bands', count: 12, view: 'liked' }
]

// Methods
const loadBands = async () => {
  try {
    isLoading.value = true
    loadingError.value = null
    
    // Fetch bands from database
    const response = await bandService.list({ limit: 20, status: 'published' })
    
    // Process bands and add gradients
    const bands = response.documents.map((band, index) => ({
      ...band,
      gradient: gradients[index % gradients.length],
      year: band.formationYear || new Date(band.$createdAt).getFullYear(),
      location: band.origin || 'Unknown',
      plays: Math.floor(Math.random() * 50000), // Placeholder
      rating: 4 + Math.random() // Placeholder
    }))
    
    sampleBands.value = bands
    
    // Filter user's bands if authenticated
    if (authStore.userId) {
      userBands.value = bands.filter(band => band.userId === authStore.userId)
    }
    
  } catch (error) {
    console.error('Error loading bands:', error)
    loadingError.value = 'Failed to load bands. Please try again.'
    
    // Fallback to sample data
    sampleBands.value = [
      {
        id: '1',
        bandName: 'Cosmic Drift',
        primaryGenre: 'Ambient/Space Rock',
        year: '2022',
        location: 'Berlin, Germany',
        plays: '6.9K',
        rating: 4,
        gradient: 'bg-gradient-to-br from-purple-600 to-pink-600'
      },
      {
        id: '2',
        bandName: 'Electric Waves',
        primaryGenre: 'Electronic/Dubstep',
        year: '2023',
        location: 'Los Angeles, USA',
        plays: '22.1K',
        rating: 4,
        gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600'
      }
    ]
  } finally {
    isLoading.value = false
  }
}

const selectBand = async (band) => {
  console.log('Selected band:', band)
  
  // Navigate to band page
  router.push(`/band/${band.$id || band.id}`)
  
  // Load band's music for player
  try {
    const albums = await albumService.getByBandId(band.$id || band.id)
    if (albums && albums.length > 0) {
      const songs = await songService.getByAlbumId(albums[0].$id)
      
      // Filter songs with audio URLs
      const playableSongs = songs.filter(song => song.audioUrl)
      
      if (playableSongs.length > 0) {
        // Set playlist in player store
        playerStore.setPlaylist(playableSongs, 0)
        
        // Update current band and album in player
        playerStore.currentBand = band
        playerStore.currentAlbum = albums[0]
      }
    }
  } catch (error) {
    console.error('Error loading band music:', error)
  }
}

const playBandMusic = async (band) => {
  try {
    // Load albums for this band
    const albums = await albumService.getByBandId(band.$id || band.id)
    
    if (albums && albums.length > 0) {
      // Get songs from the first album
      const songs = await songService.getByAlbumId(albums[0].$id)
      
      // Filter songs with audio URLs
      const playableSongs = songs.filter(song => song.audioUrl)
      
      if (playableSongs.length > 0) {
        // Play the album
        await playerStore.playAlbum(albums[0], band, 0)
      } else {
        console.warn('No playable songs found for band:', band.bandName)
      }
    }
  } catch (error) {
    console.error('Error playing band music:', error)
  }
}

const playTrackAtIndex = async (index) => {
  if (index >= 0 && index < playerStore.playlist.length) {
    playerStore.currentIndex = index
    const track = playerStore.playlist[index]
    await playerStore.loadTrack(track, playerStore.currentBand, playerStore.currentAlbum)
    playerStore.play()
  }
}

onMounted(async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Optionally redirect to login
    // router.push('/auth')
  }
  
  // Load user profile if authenticated
  if (authStore.user) {
    userProfile.value.name = authStore.user.name || 'Music Creator'
  }
  
  // Load bands from database
  await loadBands()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>