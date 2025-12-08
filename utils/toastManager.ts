/**
 * Global Toast Manager
 *
 * Provides a global toast notification system that works both inside and outside Vue component context.
 * This solves the issue where Pinia stores (which can run outside component context) need to show toasts.
 *
 * Usage:
 * - In components: Use the regular useToast() composable
 * - In stores/utilities: Import and use globalToast directly
 */

import type { ToastMessageOptions } from 'primevue/toast'

type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

interface ToastMessage {
  severity: ToastSeverity
  summary: string
  detail?: string
  life?: number
}

class ToastManager {
  private toastService: any = null
  private pendingMessages: ToastMessage[] = []

  /**
   * Register the PrimeVue toast service instance
   * Called automatically when a component uses useToast()
   */
  register(toastService: any) {
    this.toastService = toastService

    // Show any pending messages that were queued before registration
    if (this.pendingMessages.length > 0) {
      console.log(`[ToastManager] Showing ${this.pendingMessages.length} pending messages`)
      this.pendingMessages.forEach(msg => {
        this.toastService.add(msg)
      })
      this.pendingMessages = []
    }
  }

  /**
   * Unregister the toast service
   */
  unregister() {
    this.toastService = null
  }

  /**
   * Show a toast notification
   * If no toast service is registered, the message is queued
   */
  add(message: ToastMessage) {
    if (this.toastService) {
      this.toastService.add(message)
    } else {
      // Queue the message for later if toast service not yet available
      console.warn('[ToastManager] Toast service not registered yet, queuing message:', message)
      this.pendingMessages.push(message)
    }
  }

  /**
   * Convenience methods for common toast types
   */
  success(summary: string, detail?: string, life = 3000) {
    this.add({ severity: 'success', summary, detail, life })
  }

  info(summary: string, detail?: string, life = 3000) {
    this.add({ severity: 'info', summary, detail, life })
  }

  warn(summary: string, detail?: string, life = 4000) {
    this.add({ severity: 'warn', summary, detail, life })
  }

  error(summary: string, detail?: string, life = 5000) {
    this.add({ severity: 'error', summary, detail, life })
  }

  /**
   * Check if toast service is available
   */
  get isAvailable() {
    return this.toastService !== null
  }
}

// Export singleton instance
export const globalToast = new ToastManager()
