import { ref, computed } from 'vue'
import type { CallHistory } from '~/types'

export interface CallHistoryFilters {
  dateRange: Date[] | null
  direction: string | null
  status: string | null
  agentId: string | null
  queueName: string | null
  search: string
}

export function useCallHistoryFilters() {
  const callStore = useCallStore()
  const authStore = useAuthStore()
  const agentStore = useAgentStore()

  const filters = ref<CallHistoryFilters>({
    dateRange: null,
    direction: null,
    status: null,
    agentId: null,
    queueName: null,
    search: '',
  })

  const directionOptions = [
    { label: 'Todos', value: null },
    { label: 'Recebidas', value: 'inbound' },
    { label: 'Realizadas', value: 'outbound' },
  ]

  const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Completadas', value: 'completed' },
    { label: 'Perdidas', value: 'missed' },
    { label: 'Rejeitadas', value: 'rejected' },
    { label: 'Abandonadas', value: 'abandoned' },
  ]

  const queueOptions = computed(() => {
    const allOption = { label: 'Todas as filas', value: null }
    const uniqueQueues = [...new Set(callStore.callHistory
      .filter(call => call.queueName)
      .map(call => call.queueName))]
    const queues = uniqueQueues.map(queue => ({
      label: queue,
      value: queue
    }))
    return [allOption, ...queues]
  })

  const agentOptions = computed(() => {
    const allOption = { label: 'Todos os agentes', value: null }
    const agents = agentStore.agents.map(agent => ({
      label: `${agent.name} (${agent.extension})`,
      value: agent.id
    }))
    return [allOption, ...agents]
  })

  const filteredCalls = computed(() => {
    // Backend already filters calls for the current user (including calls where
    // user is caller or callee), so we don't need to filter by agentId here.
    // For non-admins, the backend returns only their calls.
    // For admins, we may apply the agent filter below.
    let calls = [...callStore.callHistory]

    // Admin agent filter
    if (authStore.isAdmin && filters.value.agentId) {
      calls = calls.filter(call => call.agentId === filters.value.agentId)
    }

    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      const [start, end] = filters.value.dateRange
      if (start && end) {
        calls = calls.filter(call => {
          const callDate = new Date(call.timestamp)
          return callDate >= start && callDate <= end
        })
      }
    }

    if (filters.value.direction) {
      calls = calls.filter(call => call.direction === filters.value.direction)
    }

    if (filters.value.status) {
      calls = calls.filter(call => call.status === filters.value.status)
    }

    if (filters.value.queueName) {
      calls = calls.filter(call => call.queueName === filters.value.queueName)
    }

    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      calls = calls.filter(call =>
        call.number.toLowerCase().includes(searchLower) ||
        call.callerName?.toLowerCase().includes(searchLower) ||
        (authStore.isAdmin && call.agentName?.toLowerCase().includes(searchLower))
      )
    }

    return calls
  })

  const hasQueueCalls = computed(() => {
    return filteredCalls.value.some(call => call.queueName)
  })

  const clearFilters = () => {
    filters.value = {
      dateRange: null,
      direction: null,
      status: null,
      agentId: null,
      queueName: null,
      search: '',
    }
  }

  return {
    filters,
    directionOptions,
    statusOptions,
    queueOptions,
    agentOptions,
    filteredCalls,
    hasQueueCalls,
    clearFilters,
  }
}
