import { defineStore } from 'pinia'
import type { Notification, NotificationType, ReleaseNote } from '~/types'

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
    isInitialized: false,
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
      this.persistReleaseNotes()

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
      this.persistReleaseNotes()
    },

    markAllReleaseNotesAsRead() {
      this.releaseNotes.forEach(note => {
        note.isRead = true
      })
      this.hasUnreadReleaseNotes = false
      this.persistReleaseNotes()
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

    /**
     * Load basic preferences that work for both anonymous and authenticated users
     * Called on every route navigation
     */
    loadBasicPreferences() {
      this.loadDarkModePreference()
    },

    /**
     * Initialize authenticated user preferences
     * Only called after successful authentication
     */
    initializeAuthenticated() {
      if (this.isInitialized) return

      this.loadNotificationPreferences()
      this.loadReleaseNotes()

      this.isInitialized = true
    },

    /**
     * @deprecated Use loadBasicPreferences() and initializeAuthenticated() instead
     * Initialize the UI store - load all persisted preferences
     * Call this once on app initialization
     */
    initialize() {
      if (this.isInitialized) return

      this.loadDarkModePreference()
      this.loadNotificationPreferences()
      this.loadReleaseNotes()

      this.isInitialized = true
    },

    /**
     * Load release notes from localStorage
     * TODO: Replace with API call to fetch release notes from backend
     */
    loadReleaseNotes() {
      if (import.meta.client) {
        const saved = localStorage.getItem('release_notes')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            this.releaseNotes = parsed.map((note: any) => ({
              ...note,
              date: new Date(note.date),
            }))
            this.hasUnreadReleaseNotes = this.releaseNotes.some(n => !n.isRead)
          } catch (error) {
            console.error('Failed to load release notes:', error)
          }
        }
      }
    },

    /**
     * Persist release notes to localStorage
     * TODO: This will be replaced with backend sync when API is ready
     */
    persistReleaseNotes() {
      if (import.meta.client) {
        localStorage.setItem('release_notes', JSON.stringify(this.releaseNotes))
      }
    },
  },
})
