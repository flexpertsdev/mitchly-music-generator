<!-- This is the fixed mobile layout section for the track listing -->
<!-- Replace the mobile layout section (around line 430-470) with this: -->

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
    <!-- Generate Lyrics Button -->
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
    
    <!-- Generate Audio Button -->
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
    
    <!-- Play Button -->
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
