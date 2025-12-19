export const useAudioLevel = () => {
  const audioStore = useAudioStore()
  const audioLevel = ref(0)
  const isMonitoring = ref(false)

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let microphone: MediaStreamAudioSourceNode | null = null
  let animationFrameId: number | null = null
  let stream: MediaStream | null = null

  const startMonitoring = async () => {
    if (isMonitoring.value || !import.meta.client) return

    if (!navigator.mediaDevices) {
      console.warn('MediaDevices API not available')
      return
    }

    const deviceId = audioStore.selectedMicrophoneId
    const constraints: MediaStreamConstraints = {
      audio: deviceId === 'default' ? true : { deviceId: { exact: deviceId } },
      video: false
    }

    stream = await navigator.mediaDevices.getUserMedia(constraints)

    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    microphone = audioContext.createMediaStreamSource(stream)
    microphone.connect(analyser)

    isMonitoring.value = true
    updateLevel()
  }

  const updateLevel = () => {
    if (!analyser || !isMonitoring.value) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    audioLevel.value = Math.min(100, (average / 255) * 100)

    animationFrameId = requestAnimationFrame(updateLevel)
  }

  const stopMonitoring = () => {
    if (!isMonitoring.value) return

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    if (microphone) {
      microphone.disconnect()
      microphone = null
    }

    if (analyser) {
      analyser.disconnect()
      analyser = null
    }

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }

    isMonitoring.value = false
    audioLevel.value = 0
  }

  watch(() => audioStore.selectedMicrophoneId, async (newDeviceId, oldDeviceId) => {
    if (isMonitoring.value && newDeviceId !== oldDeviceId) {
      stopMonitoring()
      await startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    audioLevel,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  }
}
