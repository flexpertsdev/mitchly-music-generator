<template>
  <div class="band-page min-h-screen bg-mitchly-dark">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <Loader class="w-12 h-12 text-mitchly-blue animate-spin mx-auto" />
        <p class="mt-4 text-gray-400">Loading band profile...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <XCircle class="w-12 h-12 text-red-500 mx-auto" />
        <p class="mt-4 text-white font-semibold">Band not found</p>
        <p class="text-gray-400">{{ error }}</p>
        <router-link to="/" class="mt-4 inline-block text-mitchly-blue hover:text-mitchly-blue/80">
          ← Back to Home
        </router-link>
      </div>
    </div>

    <!-- Generation Progress -->
    <div v-else-if="band && (band.status === 'draft' || band.status === 'generating')" class="flex items-center justify-center min-h-screen">
      <div class="max-w-md w-full mx-4">
        <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800">
          <!-- Progress Title -->
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white mb-2">Creating Your Band Profile</h2>
            <p class="text-gray-400">{{ band.status === 'draft' ? 'Initializing...' : 'AI is crafting your unique band identity' }}</p>
          </div>
          
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="w-full bg-mitchly-dark rounded-full h-3 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-mitchly-blue to-mitchly-purple h-full transition-all duration-1000 ease-out animate-pulse"
                :style="`width: ${band.status === 'draft' ? '20%' : '60%'}`"
              />
            </div>
            <p class="text-sm text-gray-400 mt-2 text-center">{{ band.status === 'draft' ? 'Starting generation...' : 'Generating band profile and visuals...' }}</p>
          </div>
          
          <!-- Progress Steps -->
          <div class="space-y-3">
            <div :class="['flex items-center gap-3 p-3 rounded-lg transition-all', band.status !== 'draft' ? 'bg-mitchly-blue/20 border border-mitchly-blue/40' : 'bg-mitchly-dark/50 border border-gray-700']">
              <span class="text-2xl">🎸</span>
              <div>
                <p class="text-sm font-medium text-white">Band Profile</p>
                <p class="text-xs text-gray-400">Creating name, genre, and backstory</p>
              </div>
            </div>
            <div :class="['flex items-center gap-3 p-3 rounded-lg transition-all', band.status === 'generating' ? 'bg-mitchly-purple/20 border border-mitchly-purple/40 animate-pulse' : 'bg-mitchly-dark/50 border border-gray-700']">
              <span class="text-2xl">🎨</span>
              <div>
                <p class="text-sm font-medium text-white">Visual Identity</p>
                <p class="text-xs text-gray-400">Generating logo and artwork</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-lg bg-mitchly-dark/50 border border-gray-700">
              <span class="text-2xl">🎵</span>
              <div>
                <p class="text-sm font-medium text-white">Album & Songs</p>
                <p class="text-xs text-gray-400">Setting up track listing</p>
              </div>
            </div>
          </div>
          
          <!-- Info Message -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-500">
              This usually takes 30-60 seconds
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Band Profile -->
    <div v-else-if="band && band.status === 'published'">
      <!-- Hero Section with Band Image -->
      <div class="relative h-64 md:h-96 overflow-hidden">
        <!-- Background Image or Gradient (prefer album cover for hero) -->
        <div v-if="bandImages.albumCover || bandImages.bandPhoto" class="absolute inset-0">
          <img :src="bandImages.albumCover || bandImages.bandPhoto" :alt="bandProfile.bandName" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div v-else class="absolute inset-0 bg-gradient-to-br from-mitchly-blue to-mitchly-purple">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute inset-0 bg-white/10"></div>
          </div>
        </div>

        <!-- Band Info Overlay -->
        <div class="absolute inset-0 flex items-end">
          <div class="container mx-auto px-2 sm:px-4 md:px-6 pb-4 md:pb-8">
            <!-- Back Button (Top Left) -->
            <router-link 
              to="/gallery"
              class="absolute top-4 left-2 sm:left-4 md:left-6 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm backdrop-blur"
            >
              <ChevronLeft class="w-4 h-4" />
              <span class="hidden sm:inline">Gallery</span>
            </router-link>

            <div class="flex flex-col gap-3">
              <!-- Main Band Info Row -->
              <div class="flex items-end gap-3 sm:gap-4">
                <!-- Band Logo (smaller, using logo or album cover) -->
                <div class="flex-shrink-0">
                  <div v-if="bandImages.logo || bandImages.albumCover" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shadow-2xl">
                    <img 
                      :src="bandImages.logo || bandImages.albumCover" 
                      :alt="bandProfile.bandName" 
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div v-else class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-black/30 backdrop-blur rounded-lg flex items-center justify-center">
                    <Music class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                  </div>
                </div>
                
                <!-- Band Details -->
                <div class="flex-1 min-w-0">
                  <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 text-white">{{ bandProfile.bandName }}</h1>
                  <p class="text-sm sm:text-base md:text-lg text-white/90">{{ bandProfile.primaryGenre }}</p>
                  <div class="flex flex-wrap gap-2 sm:gap-3 mt-1">
                    <span class="text-xs sm:text-sm text-white/70">
                      <Calendar class="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Formed {{ bandProfile.formationYear }}
                    </span>
                    <span class="text-xs sm:text-sm text-white/70">
                      <MapPin class="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {{ bandProfile.origin }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Share Button Row (separate on mobile, right-aligned) -->
              <div class="flex justify-end">
                <button
                  @click="shareBand"
                  class="bg-white/90 hover:bg-white text-mitchly-dark px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg text-sm"
                >
                  <Share2 class="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-mitchly-darker border-b border-mitchly-gray sticky top-0 z-40">
        <div class="container mx-auto px-2 sm:px-4 md:px-6">
          <div class="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-3 md:py-4 px-3 md:px-2 border-b-2 font-medium transition-colors whitespace-nowrap text-sm md:text-base',
                activeTab === tab.id 
                  ? 'border-mitchly-blue text-mitchly-blue' 
                  : 'border-transparent text-gray-400 hover:text-white'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- About -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h2 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <div class="w-1 h-6 bg-mitchly-blue rounded-full"></div>
                About
              </h2>
              <p class="text-gray-300 mb-4 leading-relaxed">{{ bandProfile.backstory }}</p>
              <p class="text-gray-300 leading-relaxed">{{ bandProfile.coreSound }}</p>
            </div>

            <!-- Details -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h2 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <div class="w-1 h-6 bg-mitchly-purple rounded-full"></div>
                Details
              </h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Vocal Style</dt>
                  <dd class="text-white font-medium">{{ bandProfile.vocalStyle?.type || bandProfile.vocalStyle }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Production Style</dt>
                  <dd class="text-white font-medium">{{ bandProfile.productionStyle }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Influences</dt>
                  <dd class="flex flex-wrap gap-2">
                    <Chip 
                      v-for="(influence, idx) in bandProfile.influences"
                      :key="idx"
                      :variant="getChipVariant(idx)"
                    >
                      {{ influence }}
                    </Chip>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400 mb-2">Lyrical Themes</dt>
                  <dd class="flex flex-wrap gap-2">
                    <Chip 
                      v-for="(theme, idx) in bandProfile.lyricalThemes"
                      :key="idx"
                      :variant="getChipVariant(idx + 3)"
                    >
                      {{ theme }}
                    </Chip>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Additional Info Grid -->
          <div class="grid md:grid-cols-2 gap-6 mt-8">
            <!-- Band Formation Story -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                Band Formation Story
              </h3>
              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-gray-400">How we met:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.howMet }}</p>
                </div>
                <div>
                  <span class="text-gray-400">Early days:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.earlyDays }}</p>
                </div>
                <div>
                  <span class="text-gray-400">Breakthrough:</span>
                  <p class="text-gray-300 mt-1">{{ bandProfile.formationStory?.breakthrough }}</p>
                </div>
              </div>
            </div>

            <!-- Visual Identity Style -->
            <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 shadow-xl">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Visual Identity Style
              </h3>
              <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentityStyle }}</p>
            </div>
          </div>

          <!-- AI Description -->
          <div class="bg-gradient-to-r from-mitchly-blue/10 to-mitchly-purple/10 rounded-xl p-6 mt-6 border border-mitchly-blue/30 shadow-xl">
            <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
              <div class="w-2 h-2 bg-mitchly-blue rounded-full animate-pulse"></div>
              AI Music Platform Description
            </h3>
            <p class="text-gray-300 leading-relaxed">{{ bandProfile.aiDescription }}</p>
          </div>
        </div>

        <!-- Music Tab -->
        <div v-show="activeTab === 'music'">
          <!-- Album Info -->
          <div class="bg-gradient-to-br from-mitchly-gray to-mitchly-dark rounded-xl p-6 border border-gray-800 mb-8 shadow-xl">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h2 class="text-2xl font-bold mb-3 text-white flex items-center gap-3">
                  <div class="w-12 h-12 bg-mitchly-purple/20 rounded-lg flex items-center justify-center">
                    <Music class="w-6 h-6 text-mitchly-purple" />
                  </div>
                  {{ bandProfile.albumConcept?.title }}
                </h2>
                <p class="text-gray-300 leading-relaxed">{{ bandProfile.albumConcept?.description }}</p>
              </div>
            </div>
          </div>

          <!-- Track Listing -->
          <div class="bg-mitchly-gray rounded-xl p-3 sm:p-4 md:p-6 border border-gray-800 shadow-xl">
            <h3 class="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
              <div class="w-1 h-6 bg-mitchly-blue rounded-full"></div>
              Track Listing
            </h3>
            <div class="space-y-2 sm:space-y-3">
              <div
                v-for="(track, index) in bandProfile.trackListing"
                :key="index"
                class="border border-gray-700 rounded-lg overflow-hidden hover:border-mitchly-blue/50 transition-all duration-300 bg-mitchly-dark/30"
              >
                <!-- Track Header (Always Visible) -->
                <div 
                  class="p-3 sm:p-4 hover:bg-mitchly-dark/50 transition-all cursor-pointer"
                  @click="toggleTrack(index)"
                >
                  <!-- Mobile Layout: Stack elements -->
                  <div class="sm:hidden">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex items-center gap-2 flex-1">
                        <span class="text-gray-400 text-sm">{{ index + 1 }}.</span>
                        <span class="font-medium text-white text-sm">{{ track }}</span>

                      </div>
                      <ChevronDown 
                        :class="['w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expandedTracks[index] ? 'rotate-180' : '']"
                      />
                    </div>
                    <!-- Action Buttons (Below title on mobile) -->
                    <div class="flex gap-2 mt-2">
                      <button
                        v-if="!getSongLyrics(track)"
                        @click.stop="handleGenerateSong(track, index + 1)"
                        :disabled="generatingSongIndex === index"
                        class="bg-mitchly-purple hover:bg-mitchly-purple/80 text-white px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg flex-1"
                      >
                        <Zap v-if="generatingSongIndex !== index" class="w-3 h-3" />
                        <div v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{{ generatingSongIndex === index ? 'Generating...' : 'Generate Lyrics' }}</span>
                      </button>
                      <button
                        v-if="getSongLyrics(track) && !getSongAudio(track)"
                        @click.stop="handleGenerateAudio(track)"
                        :disabled="audioGenerationStatus[track]?.status === 'processing'"
                        class="bg-mitchly-blue hover:bg-mitchly-blue/80 text-white px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg flex-1"
                      >
                        <Music2 v-if="!audioGenerationStatus[track]?.status" class="w-3 h-3" />
                        <div v-else-if="audioGenerationStatus[track]?.status === 'processing'" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          {{ audioGenerationStatus[track]?.status === 'processing' ? 'Generating...' : 'Generate Audio' }}
                        </span>
                      </button>
                      <button
                        v-if="getSongAudio(track)"
                        @click.stop="handlePlaySong(track)"
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg hover:shadow-xl flex-1"
                      >
                        <PlayCircle class="w-3 h-3" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>

                  <!-- Desktop Layout: Side by side -->
                  <div class="hidden sm:flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                      <span class="text-gray-400 w-8">{{ index + 1 }}.</span>
                      <span class="font-medium text-white">{{ track }}</span>

                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="!getSongLyrics(track)"
                        @click.stop="handleGenerateSong(track, index + 1)"
                        :disabled="generatingSongIndex === index"
                        class="bg-mitchly-purple hover:bg-mitchly-purple/80 text-white px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Zap v-if="generatingSongIndex !== index" class="w-3 h-3" />
                        <div v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span class="hidden lg:inline">{{ generatingSongIndex === index ? 'Generating...' : 'Generate Lyrics' }}</span>
                        <span class="lg:hidden">{{ generatingSongIndex === index ? '...' : 'Lyrics' }}</span>
                      </button>
                      <button
                        v-if="getSongLyrics(track) && !getSongAudio(track)"
                        @click.stop="handleGenerateAudio(track)"
                        :disabled="audioGenerationStatus[track]?.status === 'processing'"
                        class="bg-mitchly-blue hover:bg-mitchly-blue/80 text-white px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Music2 v-if="!audioGenerationStatus[track]?.status" class="w-3 h-3" />
                        <div v-else-if="audioGenerationStatus[track]?.status === 'processing'" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span class="hidden lg:inline">
                          {{ audioGenerationStatus[track]?.status === 'processing' ? 'Generating...' : 'Generate Audio' }}
                        </span>
                        <span class="lg:hidden">
                          {{ audioGenerationStatus[track]?.status === 'processing' ? '...' : 'Audio' }}
                        </span>
                      </button>
                      <button
                        v-if="getSongAudio(track)"
                        @click.stop="handlePlaySong(track)"
                        class="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 shadow-lg hover:shadow-xl"
                      >
                        <PlayCircle class="w-3 h-3" />
                        <span class="hidden lg:inline">Play</span>
                        <span class="lg:hidden">Play</span>
                      </button>
                      <!-- Expand/Collapse Icon -->
                      <ChevronDown 
                        :class="['w-5 h-5 text-gray-400 transition-transform', expandedTracks[index] ? 'rotate-180' : '']"
                      />
                    </div>
                  </div>
                  <!-- Song Description Preview (if available) -->
                  <div v-if="getSongDescription(track) && !expandedTracks[index]" class="mt-2 pl-6 sm:pl-11">
                    <p class="text-xs sm:text-sm text-gray-400 line-clamp-2">{{ getSongDescription(track) }}</p>
                  </div>
                </div>

                <!-- Expanded Content -->
                <div v-if="expandedTracks[index]" class="border-t border-gray-700 p-6 bg-mitchly-dark/70">
                  <!-- Song Description -->
                  <div v-if="getSongDescription(track)" class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-300 mb-2">Song Description</h4>
                    <p class="text-gray-400 text-sm">{{ getSongDescription(track) }}</p>
                  </div>
                  
                  <!-- Lyrics -->
                  <div v-if="getSongLyrics(track)">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-semibold text-gray-300">Lyrics</h4>
                      <button
                        @click="copyToClipboard(getSongLyricsForMureka(songs.find(s => s.title === track)), 'Lyrics')"
                        class="bg-green-600/20 hover:bg-green-600/30 px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1 text-green-400 border border-green-600/30"
                      >
                        <Copy v-if="copiedMessage !== 'Lyrics'" class="w-3 h-3" />
                        <CheckCircle v-else class="w-3 h-3" />
                        {{ copiedMessage === 'Lyrics' ? 'Copied!' : 'Copy Lyrics' }}
                      </button>
                    </div>
                    <pre class="whitespace-pre-wrap text-gray-400 text-sm font-sans bg-mitchly-dark/50 p-4 rounded-lg border border-gray-700">{{ getSongLyrics(track) }}</pre>
                  </div>
                  
                  <!-- No Content Message -->
                  <div v-if="!getSongLyrics(track) && !getSongDescription(track)" class="text-center py-4">
                    <p class="text-gray-500 text-sm">Click "Generate Lyrics" to create content for this song</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>

        <!-- Visual Tab -->
        <div v-show="activeTab === 'visual'">
          <!-- Visual Identity Description -->
          <div class="bg-mitchly-gray rounded-xl p-6 border border-gray-800 mb-6 shadow-xl">
            <h2 class="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <div class="w-1 h-6 bg-mitchly-purple rounded-full"></div>
              Visual Identity
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-mitchly-blue rounded-full"></div>
                  Colors
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.colors }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-mitchly-purple rounded-full"></div>
                  Aesthetic
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.aesthetic }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  Logo Concept
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.logo }}</p>
              </div>
              <div class="bg-mitchly-dark/50 rounded-lg p-4 border border-gray-700">
                <h3 class="font-semibold mb-2 text-white flex items-center gap-2">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Overall Style
                </h3>
                <p class="text-gray-300 text-sm leading-relaxed">{{ bandProfile.visualIdentity?.style }}</p>
              </div>
            </div>
          </div>


          <!-- Generated Images Grid -->
          <div v-if="bandImages.logo || bandImages.albumCover || bandImages.bandPhoto" class="grid md:grid-cols-3 gap-6">
            <!-- Band Logo -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-mitchly-blue rounded-full"></div>
                Band Logo
              </h3>
              <div v-if="bandImages.logo" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.logo" :alt="`${bandProfile.bandName} logo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Album Cover -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-mitchly-purple rounded-full"></div>
                Album Cover
              </h3>
              <div v-if="bandImages.albumCover" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.albumCover" :alt="`${bandProfile.albumConcept?.title} cover`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Band Photo -->
            <div class="bg-mitchly-gray rounded-xl p-4 border border-gray-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 class="font-semibold mb-3 text-white flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                Band Photo
              </h3>
              <div v-if="bandImages.bandPhoto" class="aspect-square rounded-lg overflow-hidden bg-mitchly-dark">
                <img :src="bandImages.bandPhoto" :alt="`${bandProfile.bandName} photo`" class="w-full h-full object-cover" />
              </div>
              <div v-else class="aspect-square rounded-lg bg-gradient-to-br from-mitchly-dark to-mitchly-gray flex items-center justify-center border border-gray-700">
                <Music class="w-12 h-12 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 left-4 md:left-auto space-y-2 z-50 pointer-events-none">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'bg-mitchly-gray border rounded-lg shadow-lg p-3 md:p-4 md:min-w-[250px] md:max-w-sm pointer-events-auto transition-all ml-auto',
            toast.type === 'success' ? 'border-green-600/50' : 
            toast.type === 'error' ? 'border-red-600/50' : 'border-gray-700'
          ]"
        >
          <div class="flex items-center gap-2 md:gap-3">
            <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
            <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
            <Music v-else class="w-4 h-4 md:w-5 md:h-5 text-mitchly-blue flex-shrink-0" />
            <p class="text-white text-xs md:text-sm">{{ toast.message }}</p>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Fixed Audio Player -->
    <transition name="slide-up">
      <div v-if="showAudioPlayer && currentlyPlayingTrack" class="fixed bottom-0 left-0 right-0 bg-mitchly-gray border-t border-gray-700 shadow-2xl z-40">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-semibold text-white">Now Playing</h4>
            <button
              @click="showAudioPlayer = false"
              class="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle class="w-5 h-5" />
            </button>
          </div>
          <AudioPlayer 
            :audioUrl="currentlyPlayingTrack.audioUrl"
            :title="currentlyPlayingTrack.title"
            :autoplay="true"
            @ended="showAudioPlayer = false"
          />
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { bandService, songService } from '../services/appwrite';
import AudioPlayer from '../components/AudioPlayer.vue';
import Chip from '../components/Chip.vue';
import { 
  Music, 
  Loader, 
  XCircle, 
  Calendar, 
  MapPin, 
  Share2,
  PlayCircle,
  ChevronDown,
  ChevronLeft,
  Zap,
  Music2,
  Copy,
  CheckCircle
} from 'lucide-vue-next';

const route = useRoute();

// State
const band = ref(null);
const bandProfile = computed(() => band.value?.profileData || {});
const songs = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('overview');
const expandedTracks = ref({});
const generatingSongIndex = ref(null);
const audioGenerationStatus = ref({});
const copiedMessage = ref('');
const bandImages = ref({
  logo: null,
  albumCover: null,
  bandPhoto: null
});
const toasts = ref([]);
const currentlyPlayingTrack = ref(null);
const showAudioPlayer = ref(false);

// Tabs
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'music', label: 'Music' },
  { id: 'visual', label: 'Visual Identity' }
];

// Computed
const availableAudioTracks = computed(() => {
  return songs.value
    .filter(song => song.audioUrl)
    .map(song => ({
      id: song.$id,
      title: song.title,
      artist: bandProfile.value.bandName,
      audioUrl: song.audioUrl,
      duration: song.duration
    }));
});

// Polling interval for generation status
let generationPollInterval = null;

// Load band data
onMounted(async () => {
  try {
    const bandId = route.params.id;
    
    // Load band profile
    band.value = await bandService.get(bandId);
    
    // If band is still generating, poll for updates
    if (band.value && (band.value.status === 'draft' || band.value.status === 'generating')) {
      loading.value = false; // Show generation progress instead of loading
      startGenerationPolling(bandId);
    } else {
      // Load songs and images for published bands
      songs.value = await songService.getByBandId(bandId);
      
      // Load saved images if they exist
      if (band.value) {
        bandImages.value = {
          logo: band.value.logoUrl || null,
          albumCover: band.value.albumCoverUrl || null,
          bandPhoto: band.value.bandPhotoUrl || null
        };
      }
    }
  } catch (err) {
    console.error('Error loading band:', err);
    error.value = 'Could not load band profile. Please check the URL and try again.';
  } finally {
    loading.value = false;
  }
});

// Cleanup polling on unmount
onUnmounted(() => {
  if (generationPollInterval) {
    clearInterval(generationPollInterval);
  }
});

// Poll for generation status
const startGenerationPolling = (bandId) => {
  generationPollInterval = setInterval(async () => {
    try {
      const updatedBand = await bandService.get(bandId);
      band.value = updatedBand;
      
      // Check if generation is complete
      if (updatedBand.status === 'published') {
        clearInterval(generationPollInterval);
        generationPollInterval = null;
        
        // Load songs and images
        songs.value = await songService.getByBandId(bandId);
        bandImages.value = {
          logo: updatedBand.logoUrl || null,
          albumCover: updatedBand.albumCoverUrl || null,
          bandPhoto: updatedBand.bandPhotoUrl || null
        };
        
        showToast('Band profile generated successfully!', 'success');
      } else if (updatedBand.status === 'failed') {
        clearInterval(generationPollInterval);
        generationPollInterval = null;
        error.value = 'Failed to generate band profile. Please try again.';
      }
    } catch (err) {
      console.error('Error polling band status:', err);
    }
  }, 2000); // Poll every 2 seconds
};

// Methods
const getSongLyrics = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.lyrics;
};

const getSongAudio = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.audioUrl;
};

const getSongDescription = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  return song?.description;
};

const toggleTrack = (index) => {
  expandedTracks.value[index] = !expandedTracks.value[index];
};

const handleGenerateSong = async (songTitle, trackNumber) => {
  generatingSongIndex.value = trackNumber - 1;
  
  try {
    let song = songs.value.find(s => s.title === songTitle);
    
    if (!song) {
      // Create new song with generating status
      song = await songService.create({
        bandId: band.value.$id,
        title: songTitle,
        trackNumber: trackNumber,
        status: 'generating', // Triggers lyrics generation
        audioStatus: 'pending',
        primaryGenre: band.value.primaryGenre || 'Rock',
        description: `Track ${trackNumber} from ${band.value.name}`
      });
      // Add to local songs array
      songs.value.push(song);
    } else {
      // Update existing song to trigger lyrics generation
      await songService.update(song.$id, {
        status: 'generating'
      });
    }
    
    // Start polling for completion
    const pollInterval = setInterval(async () => {
      try {
        const updatedSong = await songService.get(song.$id);
        
        if (updatedSong.status === 'completed') {
          clearInterval(pollInterval);
          // Update the song in our local array
          const songIndex = songs.value.findIndex(s => s.$id === song.$id);
          if (songIndex !== -1) {
            songs.value[songIndex] = updatedSong;
          }
          expandedTracks.value[trackNumber - 1] = true;
          showToast('Lyrics generated successfully!', 'success');
          generatingSongIndex.value = null;
        } else if (updatedSong.status === 'failed') {
          clearInterval(pollInterval);
          showToast('Failed to generate lyrics', 'error');
          generatingSongIndex.value = null;
        }
      } catch (err) {
        console.error('Error polling song status:', err);
      }
    }, 2000);
    
    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      if (generatingSongIndex.value === trackNumber - 1) {
        generatingSongIndex.value = null;
        showToast('Lyrics generation timed out. Please try again.', 'error');
      }
    }, 60000);
    
  } catch (error) {
    console.error('Error generating song:', error);
    showToast('Failed to generate song. Please try again.', 'error');
    generatingSongIndex.value = null;
  }
};

const handleGenerateAudio = async (songTitle) => {
  const song = songs.value.find(s => s.title === songTitle);
  if (!song) return;
  
  try {
    audioGenerationStatus.value[songTitle] = { status: 'processing' };
    showToast('Starting audio generation...', 'info');
    
    if (!song.lyrics) {
      throw new Error('Please generate lyrics first');
    }
    
    // Update song to trigger audio generation via Appwrite function
    await songService.update(song.$id, {
      audioStatus: 'generating',
      audioGenerationStartedAt: new Date().toISOString()
    });
    
    // Poll for audio completion
    const pollInterval = setInterval(async () => {
      try {
        const updatedSong = await songService.get(song.$id);
        
        if (updatedSong.audioStatus === 'completed' && updatedSong.audioUrl) {
          clearInterval(pollInterval);
          // Update local song data
          const songIndex = songs.value.findIndex(s => s.$id === song.$id);
          if (songIndex !== -1) {
            songs.value[songIndex] = updatedSong;
          }
          audioGenerationStatus.value[songTitle] = { status: 'completed' };
          showToast(`Audio for "${songTitle}" is ready!`, 'success');
        } else if (updatedSong.audioStatus === 'failed') {
          clearInterval(pollInterval);
          audioGenerationStatus.value[songTitle] = { status: 'failed' };
          const errorMsg = updatedSong.audioError || 'Failed to generate audio';
          showToast(errorMsg, 'error');
        } else if (updatedSong.audioStatus === 'processing') {
          // Update status to show it's being processed by Mureka
          audioGenerationStatus.value[songTitle] = { 
            status: 'processing',
            message: 'Audio is being processed by Mureka...'
          };
        }
      } catch (err) {
        console.error('Error polling audio status:', err);
      }
    }, 3000); // Poll every 3 seconds
    
    // Stop polling after 5 minutes (audio generation takes longer)
    setTimeout(() => {
      clearInterval(pollInterval);
      if (audioGenerationStatus.value[songTitle]?.status !== 'completed') {
        audioGenerationStatus.value[songTitle] = { status: 'failed' };
        showToast('Audio generation timed out. Please try again.', 'error');
      }
    }, 300000);
    
  } catch (error) {
    console.error('Error generating audio:', error);
    audioGenerationStatus.value[songTitle] = { status: 'failed' };
    showToast(error.message || 'Failed to generate audio. Please try again.', 'error');
  }
};


const copyToClipboard = async (text, type = 'Profile') => {
  try {
    await navigator.clipboard.writeText(text);
    copiedMessage.value = type;
    setTimeout(() => copiedMessage.value = '', 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const getBandProfileText = () => {
  return `Band: ${bandProfile.value.bandName}\nGenre: ${bandProfile.value.primaryGenre}\nInfluences: ${bandProfile.value.influences?.join(', ')}\nThemes: ${bandProfile.value.lyricalThemes?.join(', ')}\n\n${bandProfile.value.backstory}\n\nAlbum: ${bandProfile.value.albumConcept?.title}\n${bandProfile.value.albumConcept?.description}`;
};

const getSongLyricsForMureka = (song) => {
  return `Title: ${song.title}\n\n${song.lyrics || 'No lyrics generated yet'}`;
};

const getChipVariant = (index) => {
  const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
  return variants[index % variants.length];
};

const shareBand = async () => {
  const url = window.location.href;
  const text = `Check out ${bandProfile.value.bandName} - ${bandProfile.value.primaryGenre} band`;
  
  // Use native share on mobile devices that support it
  if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: bandProfile.value.bandName,
        text,
        url
      });
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or error:', err);
    }
  } else {
    // Desktop or browsers without share API - copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy link', 'error');
    }
  }
};

// Toast notification system
const showToast = (message, type = 'info') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
};

const handlePlaySong = (trackTitle) => {
  const song = songs.value.find(s => s.title === trackTitle);
  if (!song || !song.audioUrl) return;
  
  currentlyPlayingTrack.value = {
    id: song.$id,
    title: song.title,
    artist: bandProfile.value.bandName,
    audioUrl: song.audioUrl,
    duration: song.duration
  };
  showAudioPlayer.value = true;
};
</script>

<style scoped>
.band-page {
  min-height: 100vh;
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

/* Slide up animation for audio player */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>