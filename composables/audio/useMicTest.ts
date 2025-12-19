export const useMicTest = () => {
  const audioStore = useAudioStore()

  const audioVisualization = ref<number[]>(Array(32).fill(0))
  const currentLevel = ref(0)
  const averageLevel = ref(0)
  const peakLevel = ref(0)
  const noiseLevel = ref(0)
  const dynamicRange = ref(0)
  const loopbackEnabled = ref(false)
  const loopbackAudioElement = ref<HTMLAudioElement | null>(null)
  const isMonitoring = ref(false)

  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const microphone = ref<MediaStreamAudioSourceNode | null>(null)
  const stream = ref<MediaStream | null>(null)
  let animationFrameId: number | null = null

  const levelHistory: number[] = []
  const maxHistorySize = 100

  const startTest = async () => {
    if (!import.meta.client) return

    const { execute } = useCommandExecutor()

    await execute({
      action: async () => {
        const deviceId = audioStore.selectedMicrophoneId
        const constraints: MediaStreamConstraints = {
          audio: deviceId === 'default'
            ? {
                echoCancellation: audioStore.noiseCancellation,
                noiseSuppression: audioStore.noiseCancellation,
                autoGainControl: true,
              }
            : {
                deviceId: { exact: deviceId },
                echoCancellation: audioStore.noiseCancellation,
                noiseSuppression: audioStore.noiseCancellation,
                autoGainControl: true,
              },
          video: false,
        }

        stream.value = await navigator.mediaDevices.getUserMedia(constraints)

        audioContext.value = new AudioContext()
        analyser.value = audioContext.value.createAnalyser()
        analyser.value.fftSize = 512
        analyser.value.smoothingTimeConstant = 0.8

        microphone.value = audioContext.value.createMediaStreamSource(stream.value)
        microphone.value.connect(analyser.value)

        isMonitoring.value = true
        updateVisualization()
      },
      errorMessage: 'Não foi possível acessar o microfone. Verifique as permissões do navegador.',
      logPrefix: 'Start Mic Test',
      showSuccessToast: false,
      rethrow: false,
    })
  }

  const stopTest = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    if (microphone.value) {
      microphone.value.disconnect()
      microphone.value = null
    }

    if (analyser.value) {
      analyser.value.disconnect()
      analyser.value = null
    }

    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }

    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }

    isMonitoring.value = false
    loopbackEnabled.value = false
    currentLevel.value = 0
    audioVisualization.value = Array(32).fill(0)
    levelHistory.length = 0
    averageLevel.value = 0
    peakLevel.value = 0
    noiseLevel.value = 0
    dynamicRange.value = 0
  }

  const updateVisualization = () => {
    if (!analyser.value || !isMonitoring.value) return

    const dataArray = new Uint8Array(analyser.value.frequencyBinCount)
    analyser.value.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const levelPercent = Math.min(100, (average / 255) * 100 * (audioStore.microphoneVolume / 100))
    currentLevel.value = levelPercent

    const barCount = 32
    const barSize = Math.floor(dataArray.length / barCount)
    const newVisualization = []

    for (let i = 0; i < barCount; i++) {
      const start = i * barSize
      const end = start + barSize
      const barData = dataArray.slice(start, end)
      const barAverage = barData.reduce((a, b) => a + b) / barData.length
      const barPercent = Math.min(100, (barAverage / 255) * 100)
      newVisualization.push(barPercent)
    }

    audioVisualization.value = newVisualization

    updateQualityMetrics(levelPercent)

    animationFrameId = requestAnimationFrame(updateVisualization)
  }

  const updateQualityMetrics = (level: number) => {
    levelHistory.push(level)
    if (levelHistory.length > maxHistorySize) {
      levelHistory.shift()
    }

    averageLevel.value = Math.round(
      levelHistory.reduce((a, b) => a + b, 0) / levelHistory.length
    )

    peakLevel.value = Math.round(Math.max(...levelHistory))
    noiseLevel.value = Math.round(Math.min(...levelHistory))
    dynamicRange.value = peakLevel.value - noiseLevel.value
  }

  const toggleLoopback = () => {
    loopbackEnabled.value = !loopbackEnabled.value

    if (loopbackEnabled.value && stream.value && loopbackAudioElement.value) {
      loopbackAudioElement.value.srcObject = stream.value
      loopbackAudioElement.value.volume = audioStore.speakerVolume / 100
      loopbackAudioElement.value.muted = false
    } else if (loopbackAudioElement.value) {
      loopbackAudioElement.value.muted = true
      loopbackAudioElement.value.srcObject = null
    }
  }

  const qualityScore = computed(() => {
    if (levelHistory.length === 0) return 0

    let score = 0

    if (averageLevel.value >= 30 && averageLevel.value <= 70) {
      score += 5
    } else if (averageLevel.value >= 20 && averageLevel.value <= 80) {
      score += 3
    } else {
      score += 1
    }

    if (noiseLevel.value < 10) {
      score += 3
    } else if (noiseLevel.value < 20) {
      score += 2
    } else {
      score += 1
    }

    if (dynamicRange.value >= 30) {
      score += 2
    } else if (dynamicRange.value >= 20) {
      score += 1
    }

    return Math.min(10, score)
  })

  const isTestRunning = computed(() => isMonitoring.value)


  const getStream = () => stream.value

  watch(() => audioStore.selectedMicrophoneId, async (newDeviceId, oldDeviceId) => {
    if (isTestRunning.value && newDeviceId !== oldDeviceId) {
      stopTest()
      await startTest()
    }
  })

  watch(() => audioStore.speakerVolume, (newVolume) => {
    if (loopbackAudioElement.value && loopbackEnabled.value) {
      loopbackAudioElement.value.volume = newVolume / 100
    }
  })

  onUnmounted(() => {
    stopTest()
  })

  return {
    currentLevel,
    audioVisualization,
    averageLevel,
    peakLevel,
    noiseLevel,
    dynamicRange,
    qualityScore,
    loopbackEnabled,
    loopbackAudioElement,
    isTestRunning,
    isMonitoring,

    startTest,
    stopTest,
    toggleLoopback,
    getStream,
  }
}
