import type { CallHistory } from '~/types'

const STORAGE_KEY = 'stcall_call_history'
const MAX_HISTORY_ITEMS = 1000

export const useCallHistoryPersistence = () => {
  const saveHistory = (history: CallHistory[]): void => {
    if (!import.meta.client) return

    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
  }

  const loadHistory = (): CallHistory[] => {
    if (!import.meta.client) return []

    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return []

    const parsed = JSON.parse(serialized)
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  }

  const clearHistory = (): void => {
    if (!import.meta.client) return
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    saveHistory,
    loadHistory,
    clearHistory,
  }
}
