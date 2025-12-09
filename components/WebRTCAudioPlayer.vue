<script setup lang="ts">
/**
 * WebRTC Audio Player Component
 * Renders a hidden <audio> element that plays WebRTC remote audio
 * Automatically attaches MediaStream and plays
 */

interface Props {
  stream: MediaStream | null
  muted?: boolean
}

const props = defineProps<Props>()
const audioRef = ref<HTMLAudioElement | null>(null)

// Attach stream to audio element when it changes
watch(() => props.stream, (newStream) => {
  if (audioRef.value && newStream) {
    audioRef.value.srcObject = newStream
    audioRef.value.play().catch(error => {
      console.error('Failed to play audio:', error)
    })
  }
}, { immediate: true })
</script>

<template>
  <audio
    ref="audioRef"
    :muted="muted"
    autoplay
    style="display: none;"
  />
</template>
