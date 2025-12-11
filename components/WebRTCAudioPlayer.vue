<script setup lang="ts">

interface Props {
  stream: MediaStream | null
  muted?: boolean
}

const props = defineProps<Props>()
const audioRef = ref<HTMLAudioElement | null>(null)

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
