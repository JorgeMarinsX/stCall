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


  register(toastService: any) {
    this.toastService = toastService

    if (this.pendingMessages.length > 0) {
      console.log(`[ToastManager] Showing ${this.pendingMessages.length} pending messages`)
      this.pendingMessages.forEach(msg => {
        this.toastService.add(msg)
      })
      this.pendingMessages = []
    }
  }


  unregister() {
    this.toastService = null
  }


  add(message: ToastMessage) {
    if (this.toastService) {
      this.toastService.add(message)
    } else {
      console.warn('[ToastManager] Toast service not registered yet, queuing message:', message)
      this.pendingMessages.push(message)
    }
  }

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


  get isAvailable() {
    return this.toastService !== null
  }
}

export const globalToast = new ToastManager()
