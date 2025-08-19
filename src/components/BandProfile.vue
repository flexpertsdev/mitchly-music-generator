<template>
  <div class="px-4 pb-8">
    <div class="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <!-- Band Profile Display -->
      <div class="bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700 slide-up">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 class="text-2xl sm:text-3xl font-bold">{{ bandProfile.bandName }} - Band Profile</h2>
          <button
            @click="copyBandProfile"
            class="bg-mitchly-blue px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2 text-sm sm:text-base transition-colors self-start sm:self-auto"
          >
            <Copy class="w-4 h-4" />
            <span>Copy Profile</span>
          </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div class="space-y-4 sm:space-y-6">
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-blue mb-3">Band Overview</h3>
              <div class="space-y-2 text-sm">
                <div><strong>Primary Genre:</strong> {{ bandProfile.primaryGenre }}</div>
                <div v-if="bandProfile.secondaryGenres">
                  <strong>Secondary Genres:</strong> {{ bandProfile.secondaryGenres.join(', ') }}
                </div>
                <div v-if="bandProfile.formationYear">
                  <strong>Formation Year:</strong> {{ bandProfile.formationYear }}
                </div>
                <div v-if="bandProfile.origin">
                  <strong>Origin:</strong> {{ bandProfile.origin }}
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-blue mb-3">Core Sound</h3>
              <p class="text-gray-300 text-sm">{{ bandProfile.coreSound }}</p>
            </div>
            
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-blue mb-3">Vocal Style</h3>
              <div class="text-gray-300 text-sm space-y-1">
                <div><strong>Lead Vocals:</strong> {{ bandProfile.vocalStyle?.type || bandProfile.vocalStyle }}</div>
                <div v-if="bandProfile.vocalStyle?.characteristics">
                  <strong>Characteristics:</strong> {{ bandProfile.vocalStyle.characteristics }}
                </div>
                <div v-if="bandProfile.vocalStyle?.influences">
                  <strong>Influences:</strong> {{ bandProfile.vocalStyle.influences }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="space-y-4 sm:space-y-6">
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-purple mb-3">Musical Influences</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(influence, index) in bandProfile.influences" 
                  :key="index"
                  class="bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {{ influence }}
                </span>
              </div>
            </div>
            
            <div>
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-purple mb-3">Lyrical Themes</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(theme, index) in bandProfile.lyricalThemes" 
                  :key="index"
                  class="bg-purple-900/30 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                >
                  {{ theme }}
                </span>
              </div>
            </div>
            
            <div v-if="bandProfile.albumConcept">
              <h3 class="text-base sm:text-lg font-semibold text-mitchly-purple mb-3">
                Album: "{{ bandProfile.albumConcept.title }}"
              </h3>
              <p class="text-gray-300 text-sm">{{ bandProfile.albumConcept.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 sm:mt-8 bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h3 class="text-base sm:text-lg font-semibold text-mitchly-blue mb-3">
            AI Description ({{ bandProfile.aiDescription?.length || 0 }}/200 chars)
          </h3>
          <div class="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-600 font-mono text-sm">
            {{ bandProfile.aiDescription }}
          </div>
        </div>
      </div>

      <!-- Individual Songs -->
      <div class="bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700">
        <h2 class="text-xl sm:text-2xl font-bold mb-6 text-center">Individual Songs</h2>
        
        <div class="space-y-4 sm:space-y-6">
          <div 
            v-for="(song, index) in songs" 
            :key="index"
            class="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700"
          >
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
              <div>
                <h3 class="text-lg sm:text-xl font-semibold text-mitchly-blue">
                  {{ song.trackNumber }}. {{ song.title }}
                </h3>
                <p class="text-gray-400 text-sm mt-1">
                  <span v-if="!song.generated">Not generated yet</span>
                  <span v-else-if="song.audioStatus === 'completed'">Audio ready</span>
                  <span v-else-if="song.audioStatus === 'processing'">Generating audio...</span>
                  <span v-else-if="song.audioStatus === 'failed'">Audio generation failed</span>
                  <span v-else>Ready for audio generation</span>
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="!song.generated"
                  @click="$emit('generateSong', song.title, song.trackNumber)"
                  :disabled="generatingSongIndex === index"
                  class="bg-mitchly-purple px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm transition-colors"
                >
                  <Zap v-if="generatingSongIndex !== index" class="w-4 h-4" />
                  <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{{ generatingSongIndex === index ? 'Generating...' : 'Generate Song' }}</span>
                </button>
                <template v-else>
                  <button
                    v-if="!song.audioStatus || song.audioStatus === 'failed'"
                    @click="$emit('generateAudio', song.title, song)"
                    :disabled="song.audioStatus === 'processing'"
                    class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm transition-colors"
                  >
                    <Music class="w-4 h-4" />
                    <span>Generate Audio</span>
                  </button>
                  <button
                    v-if="song.audioStatus === 'processing'"
                    disabled
                    class="bg-gray-600 px-4 py-2 rounded-lg opacity-50 flex items-center space-x-2 text-sm"
                  >
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{{ song.audioProgress ? `${song.audioProgress}%` : 'Processing...' }}</span>
                  </button>
                  <button
                    @click="copySongForMureka(song)"
                    class="bg-mitchly-blue px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2 text-sm transition-colors"
                  >
                    <Copy class="w-4 h-4" />
                    <span>Copy for Mureka.ai</span>
                  </button>
                </template>
              </div>
            </div>
            
            <div v-if="song.generated">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p class="text-sm text-gray-400 mb-1">Artist Description:</p>
                  <p class="text-sm bg-gray-800 p-2 sm:p-3 rounded border font-mono">
                    {{ song.artistDescription }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-400 mb-1">
                    Song Description ({{ song.songDescription?.length || 0 }} chars):
                  </p>
                  <p class="text-sm bg-gray-800 p-2 sm:p-3 rounded border font-mono">
                    {{ song.songDescription }}
                  </p>
                </div>
              </div>
              
              <details class="cursor-pointer">
                <summary class="text-mitchly-purple hover:text-purple-300 mb-3 text-sm sm:text-base">
                  View Complete Lyrics
                </summary>
                <div class="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-600 max-h-96 overflow-y-auto">
                  <pre class="text-sm text-gray-300 whitespace-pre-wrap font-mono">{{ song.lyrics }}</pre>
                </div>
              </details>
              
              <!-- Audio Player -->
              <AudioPlayer
                v-if="song.audioUrl"
                :audioUrl="song.audioUrl"
                :title="`${song.trackNumber}. ${song.title}`"
                class="mt-4"
              />
            </div>
          </div>
        </div>
        
        <div class="mt-6 sm:mt-8 text-center space-y-4">
          <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-mitchly-blue mb-3 flex items-center justify-center space-x-2">
              <FileText class="w-5 h-5" />
              <span>Ready for AI Music Generation!</span>
            </h3>
            <p class="text-gray-300 mb-4 text-sm sm:text-base">
              Generate individual songs and copy them directly into Mureka.ai or similar AI music platforms. 
              Each song includes optimized descriptions and properly formatted lyrics for best results.
            </p>
            <div class="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                @click="$emit('startOver')"
                class="bg-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-600 text-sm sm:text-base transition-colors"
              >
                Create New Project
              </button>
              <button
                @click="copyAllGeneratedSongs"
                class="bg-gradient-to-r from-mitchly-purple to-mitchly-blue px-4 sm:px-6 py-2 rounded-lg hover:from-purple-600 hover:to-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base transition-all"
              >
                <Download class="w-4 h-4" />
                <span>Copy Generated Songs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Copy, Zap, FileText, Download, Music } from 'lucide-vue-next'
import AudioPlayer from './AudioPlayer.vue'

export default {
  name: 'BandProfile',
  components: {
    Copy,
    Zap,
    FileText,
    Download,
    Music,
    AudioPlayer
  },
  props: {
    bandProfile: {
      type: Object,
      required: true
    },
    generatingSongIndex: {
      type: Number,
      default: null
    },
    audioGenerationStatus: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['generateSong', 'generateAudio', 'startOver'],
  computed: {
    songs() {
      if (this.bandProfile.songs) {
        return Object.entries(this.bandProfile.songs).map(([title, songData], index) => ({
          trackNumber: index + 1,
          title,
          generated: true,
          ...songData,
          audioStatus: this.audioGenerationStatus[title.replace(/\s+/g, '-').toLowerCase()]?.status
        }));
      }
      return this.bandProfile.trackListing?.map((title, index) => ({
        trackNumber: index + 1,
        title,
        generated: false
      })) || [];
    }
  },
  methods: {
    copyBandProfile() {
      const bandProfileText = this.formatBandProfile(this.bandProfile)
      navigator.clipboard.writeText(bandProfileText).then(() => {
        // Could add a toast notification here
        console.log('Band bandProfile copied to clipboard')
      })
    },
    
    copySongForMureka(song) {
      const songText = this.formatSongForMureka(song)
      navigator.clipboard.writeText(songText).then(() => {
        console.log('Song copied to clipboard')
      })
    },
    
    copyAllGeneratedSongs() {
      const generatedSongs = this.songs.filter(song => song.generated)
      const allSongs = generatedSongs.map(song => this.formatSongForMureka(song)).join('\n\n---\n\n')
      navigator.clipboard.writeText(allSongs).then(() => {
        console.log('All generated songs copied to clipboard')
      })
    },
    
    formatBandProfile(bandProfile) {
      return `# ${bandProfile.bandName} - Band Profile

## Band Overview
**Band Name**: ${bandProfile.bandName}
**Primary Genre**: ${bandProfile.primaryGenre}
${bandProfile.secondaryGenres ? `**Secondary Genres**: ${bandProfile.secondaryGenres.join(', ')}` : ''}
${bandProfile.formationYear ? `**Formation Year**: ${bandProfile.formationYear}` : ''}
${bandProfile.origin ? `**Origin**: ${bandProfile.origin}` : ''}

## Core Sound
${bandProfile.coreSound}

## Vocal Style
**Lead Vocals**: ${bandProfile.vocalStyle?.type || bandProfile.vocalStyle}
${bandProfile.vocalStyle?.characteristics ? `**Vocal Characteristics**: ${bandProfile.vocalStyle.characteristics}` : ''}
${bandProfile.vocalStyle?.influences ? `**Vocal Influences**: ${bandProfile.vocalStyle.influences}` : ''}

${bandProfile.instrumentation ? `## Core Instrumentation
${bandProfile.instrumentation.map(inst => `* ${inst}`).join('\n')}` : ''}

## Musical Influences
${bandProfile.influences?.map((inf, i) => `${i + 1}. **${inf}**`).join('\n')}

## Band History
${bandProfile.backstory}

${bandProfile.visualIdentity ? `## Visual Identity
**Colors**: ${bandProfile.visualIdentity.colors}
**Aesthetic**: ${bandProfile.visualIdentity.aesthetic}
**Logo Concept**: ${bandProfile.visualIdentity.logo}
**Style**: ${bandProfile.visualIdentity.style}` : ''}

## Lyrical Themes
${bandProfile.lyricalThemes?.map(theme => `* **${theme}**`).join('\n')}

${bandProfile.albumConcept ? `## Album Concept: "${bandProfile.albumConcept.title}"
${bandProfile.albumConcept.description}` : ''}

${bandProfile.trackListing ? `## Track Listing
${bandProfile.trackListing.map((track, i) => `${i + 1}. **${track}**`).join('\n')}` : ''}

${bandProfile.productionStyle ? `## Production Style
${bandProfile.productionStyle}` : ''}

## AI Description (${bandProfile.aiDescription?.length || 0}/200 characters)
${bandProfile.aiDescription}`
    },
    
    formatSongForMureka(song) {
      return `Artist: ${this.bandProfile.bandName}
Album: ${this.bandProfile.albumConcept?.title || 'Album'}
Track: ${song.trackNumber}. ${song.title}

Artist Description: ${song.artistDescription}
Song Description: ${song.songDescription}

Lyrics:
${song.lyrics}`
    }
  }
}
</script>
