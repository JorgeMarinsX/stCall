import { defineStore } from 'pinia'

export interface AudioDevice {
  id: string
  label: string
}

export const useAudioStore = defineStore('audio', {
  state: () => ({
    selectedMicrophoneId: 'default' as string,
    selectedSpeakerId: 'default' as string,
    microphoneVolume: 80,
    speakerVolume: 70,
    noiseCancellation: true,
    availableMicrophones: [{ id: 'default', label: 'Microfone padrão do sistema' }] as AudioDevice[],
    availableSpeakers: [{ id: 'default', label: 'Alto-falante padrão do sistema' }] as AudioDevice[],
  }),

  getters: {
    selectedMicrophone: (state): AudioDevice | undefined => {
      return state.availableMicrophones.find(m => m.id === state.selectedMicrophoneId)
    },
    selectedSpeaker: (state): AudioDevice | undefined => {
      return state.availableSpeakers.find(s => s.id === state.selectedSpeakerId)
    },
  },

  actions: {
    setMicrophone(deviceId: string) {
      this.selectedMicrophoneId = deviceId
      this.persistAudioSettings()
    },

    setSpeaker(deviceId: string) {
      this.selectedSpeakerId = deviceId
      this.persistAudioSettings()
    },

    setMicrophoneVolume(volume: number) {
      this.microphoneVolume = Math.max(0, Math.min(100, volume))
      this.persistAudioSettings()
    },

    setSpeakerVolume(volume: number) {
      this.speakerVolume = Math.max(0, Math.min(100, volume))
      this.persistAudioSettings()
    },

    setNoiseCancellation(enabled: boolean) {
      this.noiseCancellation = enabled
      this.persistAudioSettings()
    },

    setAvailableMicrophones(devices: AudioDevice[]) {
      this.availableMicrophones = devices.length > 0
        ? devices
        : [{ id: 'default', label: 'Microfone padrão do sistema' }]
    },

    setAvailableSpeakers(devices: AudioDevice[]) {
      this.availableSpeakers = devices.length > 0
        ? devices
        : [{ id: 'default', label: 'Alto-falante padrão do sistema' }]
    },

    persistAudioSettings() {
      if (!import.meta.client) return

      const settings = {
        selectedMicrophoneId: this.selectedMicrophoneId,
        selectedSpeakerId: this.selectedSpeakerId,
        microphoneVolume: this.microphoneVolume,
        speakerVolume: this.speakerVolume,
        noiseCancellation: this.noiseCancellation,
      }

      localStorage.setItem('audio_settings', JSON.stringify(settings))
    },

    loadAudioSettings() {
      if (!import.meta.client) return

      const saved = localStorage.getItem('audio_settings')
      if (!saved) return

      const settings = JSON.parse(saved)
      this.selectedMicrophoneId = settings.selectedMicrophoneId || 'default'
      this.selectedSpeakerId = settings.selectedSpeakerId || 'default'
      this.microphoneVolume = settings.microphoneVolume ?? 80
      this.speakerVolume = settings.speakerVolume ?? 70
      this.noiseCancellation = settings.noiseCancellation ?? true
    },
  },
})
