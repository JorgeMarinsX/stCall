import type { Session } from 'sip.js'


export const useWebRTCMedia = () => {
  const state = useWebRTCState()
  const audioStore = useAudioStore()

  /**
   * Attach media streams from RTCPeerConnection
   */
  const attachMediaStreams = (session: Session): void => {
    const sessionDescriptionHandler = session.sessionDescriptionHandler as any
    const peerConnection = sessionDescriptionHandler?.peerConnection as RTCPeerConnection

    if (!peerConnection) {
      console.error('No peer connection available')
      return
    }

    // Get local stream (our microphone)
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) {
        if (!state.localStream.value) {
          state.localStream.value = new MediaStream()
        }
        state.localStream.value.addTrack(sender.track)
      }
    })

    // Get remote stream (other party's audio)
    peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        if (!state.remoteStream.value) {
          state.remoteStream.value = new MediaStream()
        }
        state.remoteStream.value.addTrack(receiver.track)
      }
    })

    console.log('✅ Media streams attached')
  }

  /**
   * Clean up media streams
   */
  const cleanupStreams = (): void => {
    if (state.localStream.value) {
      state.localStream.value.getTracks().forEach(track => track.stop())
      state.localStream.value = null
    }

    if (state.remoteStream.value) {
      state.remoteStream.value.getTracks().forEach(track => track.stop())
      state.remoteStream.value = null
    }

    console.log('✅ Media streams cleaned up')
  }

  /**
   * Mute/unmute microphone
   */
  const setMuted = (muted: boolean): void => {
    if (!state.localStream.value) {
      console.warn('No local stream to mute')
      return
    }

    state.localStream.value.getAudioTracks().forEach(track => {
      track.enabled = !muted
    })

    console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`)
  }

  /**
   * Send DTMF digits
   */
  const sendDTMF = (digit: string): void => {
    if (!state.currentSession.value) {
      console.warn('No active session to send DTMF')
      return
    }

    const session = state.currentSession.value as any
    const sessionDescriptionHandler = session.sessionDescriptionHandler

    if (sessionDescriptionHandler?.sendDtmf) {
      sessionDescriptionHandler.sendDtmf(digit)
      console.log(`📞 Sent DTMF: ${digit}`)
    }
  }

  /**
   * Switch microphone device during active call
   */
  const switchMicrophone = async (deviceId: string): Promise<void> => {
    if (!state.currentSession.value) {
      console.warn('No active session to switch microphone')
      return
    }

    const session = state.currentSession.value as any
    const sessionDescriptionHandler = session.sessionDescriptionHandler
    const peerConnection = sessionDescriptionHandler?.peerConnection as RTCPeerConnection

    if (!peerConnection) {
      console.error('No peer connection available')
      return
    }

    const constraints: MediaStreamConstraints = {
      audio: deviceId === 'default' ? true : { deviceId: { exact: deviceId } },
      video: false
    }

    const newStream = await navigator.mediaDevices.getUserMedia(constraints)
    const newAudioTrack = newStream.getAudioTracks()[0]

    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio')
    if (sender) {
      await sender.replaceTrack(newAudioTrack)

      if (state.localStream.value) {
        const oldTrack = state.localStream.value.getAudioTracks()[0]
        oldTrack?.stop()
        state.localStream.value.removeTrack(oldTrack)
        state.localStream.value.addTrack(newAudioTrack)
      }

      console.log(`🎤 Switched to microphone: ${deviceId}`)
    }
  }

  watch(() => audioStore.selectedMicrophoneId, async (newDeviceId, oldDeviceId) => {
    if (state.currentSession.value && newDeviceId !== oldDeviceId) {
      await switchMicrophone(newDeviceId)
    }
  })

  return {
    attachMediaStreams,
    cleanupStreams,
    setMuted,
    sendDTMF,
    switchMicrophone,
  }
}
