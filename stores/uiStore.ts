import { defineStore } from 'pinia'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
  timestamp: Date
}

export interface ReleaseNote {
  version: string
  date: Date
  changes: string[]
  isRead: boolean
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    isDarkMode: false,
    notifications: [] as Notification[],
    showSidebar: true,
    releaseNotes: [] as ReleaseNote[],
    hasUnreadReleaseNotes: false,
    notificationPreferences: {
      callNotifications: true,
      systemNotifications: true,
      soundEnabled: true,
    },
  }),

  getters: {
    activeNotifications: (state) => state.notifications.slice(0, 5),
    unreadReleaseNotes: (state) => state.releaseNotes.filter(note => !note.isRead),
  },

  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode

      if (import.meta.client) {
        const html = document.documentElement
        if (this.isDarkMode) {
          html.classList.add('stcall-dark-mode')
        } else {
          html.classList.remove('stcall-dark-mode')
        }

        // Persist preference
        localStorage.setItem('dark_mode', this.isDarkMode.toString())
      }
    },

    setDarkMode(value: boolean) {
      this.isDarkMode = value

      if (import.meta.client) {
        const html = document.documentElement
        if (value) {
          html.classList.add('stcall-dark-mode')
        } else {
          html.classList.remove('stcall-dark-mode')
        }

        localStorage.setItem('dark_mode', value.toString())
      }
    },

    loadDarkModePreference() {
      if (import.meta.client) {
        const savedPreference = localStorage.getItem('dark_mode')
        if (savedPreference !== null) {
          this.setDarkMode(savedPreference === 'true')
        }
      }
    },

    showNotification(type: NotificationType, message: string, duration: number = 5000) {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type,
        message,
        duration,
        timestamp: new Date(),
      }

      this.notifications.unshift(notification)

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(notification.id)
        }, duration)
      }

      // Play sound if enabled
      if (this.notificationPreferences.soundEnabled && type !== 'info') {
        this.playNotificationSound()
      }
    },

    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearNotifications() {
      this.notifications = []
    },

    toggleSidebar() {
      this.showSidebar = !this.showSidebar
    },

    addReleaseNote(releaseNote: ReleaseNote) {
      this.releaseNotes.unshift(releaseNote)
      this.hasUnreadReleaseNotes = true

      // Show notification
      this.showNotification(
        'info',
        `Nova versão ${releaseNote.version} disponível!`,
        10000
      )
    },

    markReleaseNoteAsRead(version: string) {
      const note = this.releaseNotes.find(n => n.version === version)
      if (note) {
        note.isRead = true
      }

      // Update unread flag
      this.hasUnreadReleaseNotes = this.releaseNotes.some(n => !n.isRead)
    },

    markAllReleaseNotesAsRead() {
      this.releaseNotes.forEach(note => {
        note.isRead = true
      })
      this.hasUnreadReleaseNotes = false
    },

    updateNotificationPreferences(preferences: Partial<typeof this.notificationPreferences>) {
      this.notificationPreferences = { ...this.notificationPreferences, ...preferences }

      if (import.meta.client) {
        localStorage.setItem('notification_preferences', JSON.stringify(this.notificationPreferences))
      }
    },

    loadNotificationPreferences() {
      if (import.meta.client) {
        const saved = localStorage.getItem('notification_preferences')
        if (saved) {
          try {
            this.notificationPreferences = JSON.parse(saved)
          } catch (error) {
            console.error('Failed to load notification preferences:', error)
          }
        }
      }
    },

    playNotificationSound() {
      if (import.meta.client) {
        // TODO: Add notification sound file and play it
        // const audio = new Audio('/sounds/notification.mp3')
        // audio.play().catch(err => console.error('Failed to play sound:', err))
      }
    },
  },
})
