import { ref, watch, onUnmounted } from 'vue'
import type { Call } from '~/types'

/**
 * Composable for tracking active call duration
 * Automatically starts/stops a timer when the call becomes active or ends
 *
 * @param activeCall - Computed or ref containing the active call
 * @returns Object with callDuration ref and manual control functions
 */
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

  // Watch for active call changes and status changes
  watch(() => {
    const call = activeCall()
    return call ? { call, status: call.status } : null
  }, (newValue) => {
    // Start duration timer when call becomes active
    if (newValue && newValue.status === 'active' && !durationInterval) {
      startTimer()
    }

    // Stop duration timer when call ends
    if (!newValue && durationInterval) {
      stopTimer()
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    stopTimer()
  })

  return {
    callDuration,
    startTimer,
    stopTimer,
  }
}
