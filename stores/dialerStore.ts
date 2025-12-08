import { defineStore } from 'pinia'

export const useDialerStore = defineStore('dialer', {
  state: () => ({
    visible: false,
    phoneNumber: '',
  }),

  getters: {
    isVisible: (state) => state.visible,
    hasPhoneNumber: (state) => state.phoneNumber.length > 0,
  },

  actions: {
    show() {
      this.visible = true
    },

    hide() {
      this.visible = false
    },

    toggle() {
      this.visible = !this.visible
    },

    setPhoneNumber(number: string) {
      this.phoneNumber = number
    },

    clearPhoneNumber() {
      this.phoneNumber = ''
    },

    reset() {
      this.visible = false
      this.phoneNumber = ''
    },
  },
})
