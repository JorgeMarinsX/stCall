import { ref } from 'vue'
import type { CallHistory } from '~/types'

export function useRecordingPlayer() {
  const showPlayer = ref(false)
  const selectedCall = ref<CallHistory | null>(null)

  const playRecording = (call: CallHistory) => {
    selectedCall.value = call
    showPlayer.value = true
  }

  const closePlayer = () => {
    showPlayer.value = false
    selectedCall.value = null
  }

  return {
    showPlayer,
    selectedCall,
    playRecording,
    closePlayer,
  }
}
