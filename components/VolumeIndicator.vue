<template>
  <div class="flex items-center gap-2">
    <i
      :class="[
        volumeIcon,
        'text-gray-600 dark:text-gray-400 cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 transition-colors',
        compact ? 'text-xs' : 'text-sm'
      ]"
      @click="toggleMute"
    ></i>
    <Slider
      v-model="volume"
      :class="compact ? 'w-16' : 'w-24'"
      :min="0"
      :max="100"
      :step="1"
    />
    <span v-if="!compact" class="text-xs text-gray-600 dark:text-gray-400 w-8 text-right">
      {{ volume }}%
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
})

const audioStore = useAudioStore()

// Two-way binding with the speaker volume in the audio store
const volume = computed({
  get: () => audioStore.speakerVolume,
  set: (value: number) => audioStore.setSpeakerVolume(value)
})

// Show different volume icons based on level
const volumeIcon = computed(() => {
  if (volume.value === 0) {
    return 'pi pi-volume-off'
  } else if (volume.value < 50) {
    return 'pi pi-volume-down'
  } else {
    return 'pi pi-volume-up'
  }
})

// Quick mute/unmute toggle
const previousVolume = ref(audioStore.speakerVolume)

const toggleMute = () => {
  if (volume.value === 0) {
    // Unmute: restore previous volume or set to 70 if it was 0
    volume.value = previousVolume.value > 0 ? previousVolume.value : 70
  } else {
    // Mute: save current volume and set to 0
    previousVolume.value = volume.value
    volume.value = 0
  }
}
</script>
