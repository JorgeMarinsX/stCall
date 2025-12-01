<template>
  <div class="audio-player">
    <!-- Call Info -->
    <div class="mb-4 p-3 surface-50 dark:surface-800 border-round">
      <div class="flex justify-content-between align-items-center mb-2">
        <span class="font-medium">{{ callInfo.callerName || 'Desconhecido' }}</span>
        <Tag :value="formatDuration(callInfo.duration)" severity="secondary" />
      </div>
      <div class="text-sm text-muted-color">
        {{ callInfo.number }} • {{ formatDateTime(callInfo.timestamp) }}
      </div>
    </div>

    <!-- Audio Element (Hidden) -->
    <audio
      ref="audioElement"
      :src="recordingUrl"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    ></audio>

    <!-- Waveform Placeholder / Progress Bar -->
    <div class="mb-4">
      <Slider
        v-model="currentTime"
        :max="duration"
        :step="0.1"
        class="w-full"
        @update:model-value="seekTo"
      />
    </div>

    <!-- Time Display -->
    <div class="flex justify-content-between text-sm text-muted-color mb-4">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>

    <!-- Controls -->
    <div class="flex justify-content-center align-items-center gap-3">
      <!-- Rewind 10s -->
      <Button
        icon="pi pi-replay"
        rounded
        text
        :disabled="currentTime === 0"
        @click="skip(-10)"
      />

      <!-- Play/Pause -->
      <Button
        :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
        rounded
        size="large"
        @click="togglePlayPause"
      />

      <!-- Forward 10s -->
      <Button
        icon="pi pi-refresh"
        rounded
        text
        :disabled="currentTime >= duration"
        @click="skip(10)"
      />
    </div>

    <!-- Playback Speed -->
    <div class="flex justify-content-center align-items-center gap-2 mt-4">
      <span class="text-sm text-muted-color">Velocidade:</span>
      <SelectButton
        v-model="playbackRate"
        :options="playbackRates"
        option-label="label"
        option-value="value"
        size="small"
        @update:model-value="changePlaybackRate"
      />
    </div>

    <!-- Download Button -->
    <div class="flex justify-content-center mt-4">
      <Button
        label="Baixar Gravação"
        icon="pi pi-download"
        severity="secondary"
        text
        @click="downloadRecording"
      />
    </div>

    <!-- Mock Notice -->
    <Message severity="info" class="mt-4">
      <template #default>
        <div class="text-sm">
          <strong>Modo de demonstração:</strong> Esta é uma gravação simulada.
          Em produção, as gravações reais do Asterisk serão reproduzidas aqui.
        </div>
      </template>
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const props = defineProps<{
  recordingUrl: string
  callInfo: {
    number: string
    callerName?: string
    timestamp: Date
    duration: number
  }
}>()

// Audio element ref
const audioElement = ref<HTMLAudioElement | null>(null)

// Player state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)

const playbackRates = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
]

// Audio event handlers
const onLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

// Player controls
const togglePlayPause = () => {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
}

const seekTo = (time: number | number[]) => {
  if (!audioElement.value) return
  const seekTime = Array.isArray(time) ? time[0] : time
  audioElement.value.currentTime = seekTime
}

const skip = (seconds: number) => {
  if (!audioElement.value) return
  const newTime = Math.max(0, Math.min(duration.value, currentTime.value + seconds))
  seekTo(newTime)
}

const changePlaybackRate = (rate: number) => {
  if (!audioElement.value) return
  audioElement.value.playbackRate = rate
}

const downloadRecording = () => {
  // In production, this would download the actual recording file
  const link = document.createElement('a')
  link.href = props.recordingUrl
  link.download = `recording-${props.callInfo.number}-${props.callInfo.timestamp.getTime()}.mp3`
  link.click()
}

// Helper functions
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cleanup
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
  }
})
</script>

<style scoped>
.audio-player {
  padding: 1rem 0;
}
</style>
