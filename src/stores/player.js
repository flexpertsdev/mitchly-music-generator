import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Howl } from 'howler'

export const usePlayerStore = defineStore('player', () => {
  // State
  const currentTrack = ref(null)
  const currentAlbum = ref(null)
  const currentBand = ref(null)
  const playlist = ref([])
  const currentIndex = ref(0)
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const volume = ref(0.7)
  const isMuted = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const repeatMode = ref('none') // 'none', 'one', 'all'
  const isShuffled = ref(false)
  const originalPlaylist = ref([])
  
  // Howler instance
  let sound = null
  
  // Computed
  const hasNext = computed(() => {
    if (repeatMode.value === 'one' || repeatMode.value === 'all') return true
    return currentIndex.value < playlist.value.length - 1
  })
  
  const hasPrevious = computed(() => {
    return currentIndex.value > 0
  })
  
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })
  
  // Methods
  const loadTrack = async (track, band = null, album = null) => {
    if (sound) {
      sound.unload()
    }
    
    isLoading.value = true
    currentTrack.value = track
    currentBand.value = band
    currentAlbum.value = album
    currentTime.value = 0
    duration.value = 0
    
    return new Promise((resolve, reject) => {
      sound = new Howl({
        src: [track.audioUrl],
        html5: true,
        volume: isMuted.value ? 0 : volume.value,
        onload: () => {
          duration.value = sound.duration()
          isLoading.value = false
          resolve()
        },
        onplay: () => {
          isPlaying.value = true
          updateProgress()
        },
        onpause: () => {
          isPlaying.value = false
        },
        onend: () => {
          isPlaying.value = false
          currentTime.value = 0
          if (repeatMode.value === 'one') {
            play()
          } else if (hasNext.value) {
            playNext()
          }
        },
        onerror: (id, error) => {
          isLoading.value = false
          isPlaying.value = false
          console.error('Playback error:', error)
          reject(error)
        }
      })
    })
  }
  
  const setPlaylist = (tracks, startIndex = 0) => {
    originalPlaylist.value = [...tracks]
    playlist.value = isShuffled.value ? shuffleArray([...tracks]) : [...tracks]
    currentIndex.value = startIndex
    
    if (tracks[startIndex]) {
      loadTrack(tracks[startIndex])
    }
  }
  
  const play = () => {
    if (sound && !isPlaying.value) {
      sound.play()
    }
  }
  
  const pause = () => {
    if (sound && isPlaying.value) {
      sound.pause()
    }
  }
  
  const togglePlayPause = () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }
  
  const playNext = async () => {
    if (!hasNext.value && repeatMode.value !== 'all') return
    
    let nextIndex = currentIndex.value + 1
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0 // Loop back to start if repeat all
    }
    
    currentIndex.value = nextIndex
    const nextTrack = playlist.value[nextIndex]
    
    if (nextTrack) {
      await loadTrack(nextTrack, currentBand.value, currentAlbum.value)
      play()
    }
  }
  
  const playPrevious = async () => {
    if (!hasPrevious.value && repeatMode.value !== 'all') return
    
    let prevIndex = currentIndex.value - 1
    if (prevIndex < 0) {
      prevIndex = playlist.value.length - 1 // Loop to end if repeat all
    }
    
    currentIndex.value = prevIndex
    const prevTrack = playlist.value[prevIndex]
    
    if (prevTrack) {
      await loadTrack(prevTrack, currentBand.value, currentAlbum.value)
      play()
    }
  }
  
  const seek = (percentage) => {
    if (sound && duration.value) {
      const seekTime = (percentage / 100) * duration.value
      sound.seek(seekTime)
      currentTime.value = seekTime
    }
  }
  
  const setVolume = (val) => {
    volume.value = val
    if (sound) {
      sound.volume(val)
    }
    if (val > 0) {
      isMuted.value = false
    }
  }
  
  const toggleMute = () => {
    isMuted.value = !isMuted.value
    if (sound) {
      sound.mute(isMuted.value)
    }
  }
  
  const toggleRepeat = () => {
    const modes = ['none', 'one', 'all']
    const currentIdx = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIdx + 1) % modes.length]
  }
  
  const toggleShuffle = () => {
    isShuffled.value = !isShuffled.value
    
    if (isShuffled.value) {
      // Shuffle playlist while keeping current track at current position
      const current = playlist.value[currentIndex.value]
      const shuffled = shuffleArray([...originalPlaylist.value])
      const newIndex = shuffled.findIndex(t => t.id === current.id)
      
      // Move current track to current position
      if (newIndex !== -1 && newIndex !== currentIndex.value) {
        shuffled.splice(newIndex, 1)
        shuffled.splice(currentIndex.value, 0, current)
      }
      
      playlist.value = shuffled
    } else {
      // Restore original order
      const current = playlist.value[currentIndex.value]
      playlist.value = [...originalPlaylist.value]
      currentIndex.value = originalPlaylist.value.findIndex(t => t.id === current.id)
    }
  }
  
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  const updateProgress = () => {
    if (sound && isPlaying.value) {
      currentTime.value = sound.seek() || 0
      requestAnimationFrame(updateProgress)
    }
  }
  
  const playAlbum = async (album, band, startIndex = 0) => {
    const tracks = album.songs || []
    if (tracks.length === 0) return
    
    originalPlaylist.value = [...tracks]
    playlist.value = isShuffled.value ? shuffleArray([...tracks]) : [...tracks]
    currentIndex.value = startIndex
    currentAlbum.value = album
    currentBand.value = band
    
    await loadTrack(tracks[startIndex], band, album)
    play()
  }
  
  const playSong = async (song, band = null, album = null) => {
    playlist.value = [song]
    originalPlaylist.value = [song]
    currentIndex.value = 0
    currentBand.value = band
    currentAlbum.value = album
    
    await loadTrack(song, band, album)
    play()
  }
  
  const clearPlayer = () => {
    if (sound) {
      sound.unload()
      sound = null
    }
    
    currentTrack.value = null
    currentAlbum.value = null
    currentBand.value = null
    playlist.value = []
    originalPlaylist.value = []
    currentIndex.value = 0
    isPlaying.value = false
    isLoading.value = false
    currentTime.value = 0
    duration.value = 0
  }
  
  return {
    // State
    currentTrack,
    currentAlbum,
    currentBand,
    playlist,
    currentIndex,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    currentTime,
    duration,
    repeatMode,
    isShuffled,
    
    // Computed
    hasNext,
    hasPrevious,
    progress,
    
    // Methods
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    setPlaylist,
    playAlbum,
    playSong,
    clearPlayer
  }
})