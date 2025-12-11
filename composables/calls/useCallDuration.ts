import { ref, watch, onUnmounted } from 'vue'
import type { Call } from '~/types'

export function useCallDuration(activeCall: () => Call | null) {
  const callDuration = ref(0)
  let durationInterval: ReturnType<typeof setInterval> | null = null

  const updateCallDuration = () => {
    const call = activeCall()
    if (call && call.status === 'active') {
      callDuration.value = Math.floor((Date.now() - call.startTime.getTime()) / 1000)
    }
  }

  const startTimer = () => {
    if (durationInterval) return
    callDuration.value = 0
    durationInterval = setInterval(updateCallDuration, 1000)
  }

  const stopTimer = () => {
    if (durationInterval) {
      clearInterval(durationInterval)
      durationInterval = null
      callDuration.value = 0
    }
  }

  watch(() => {
    const call = activeCall()
    return call ? { call, status: call.status } : null
  }, (newValue) => {
    if (newValue && newValue.status === 'active' && !durationInterval) {
      startTimer()
    }

    if (!newValue && durationInterval) {
      stopTimer()
    }
  }, { immediate: true })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    callDuration,
    startTimer,
    stopTimer,
  }
}
