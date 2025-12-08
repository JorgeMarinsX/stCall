import { defineStore } from 'pinia'
import type { AgentStatus, Agent, AgentStats } from '~/types'

export const useAgentStore = defineStore('agent', {
  state: () => ({
    agents: [] as Agent[],
    currentAgentStatus: 'offline' as AgentStatus,
    isConnectedToQueue: false,
    stats: {
      totalCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      averageDuration: 0,
      todayCalls: 0,
    } as AgentStats,
  }),

  getters: {
    availableAgents: (state) => state.agents.filter(a => a.status === 'available'),
    onCallAgents: (state) => state.agents.filter(a => a.status === 'on_call'),
    unavailableAgents: (state) => state.agents.filter(a => a.status === 'unavailable'),
    totalAgents: (state) => state.agents.length,

    agentById: (state) => (id: string) => state.agents.find(a => a.id === id),

    isAvailable: (state) => state.currentAgentStatus === 'available' && state.isConnectedToQueue,
  },

  actions: {
    // Simple state setters - no business logic
    setConnectedToQueue(connected: boolean) {
      this.isConnectedToQueue = connected
    },

    setStatus(status: AgentStatus) {
      this.currentAgentStatus = status
    },

    updateAgentStatus(agentId: string, status: AgentStatus, callInfo?: { callId?: string; callNumber?: string }) {
      const agent = this.agents.find(a => a.id === agentId)
      if (agent) {
        agent.status = status

        if (status === 'on_call' && callInfo) {
          agent.currentCallId = callInfo.callId
          agent.currentCallNumber = callInfo.callNumber
          agent.callStartTime = new Date()
        } else if (status !== 'on_call') {
          agent.currentCallId = undefined
          agent.currentCallNumber = undefined
          agent.callStartTime = undefined
        }
      }
    },

    setCurrentAgentStatus(status: AgentStatus) {
      this.currentAgentStatus = status
    },

    // Admin actions
    async fetchAllAgents() {
      // TODO: Fetch all agents from Asterisk/backend
      console.log('Fetching all agents...')

      // Mock data for now
      this.agents = [
        {
          id: '1',
          name: 'Fulano da Silva',
          email: 'fulano@example.com',
          extension: '1001',
          status: 'available',
          isConnected: true,
        },
        {
          id: '2',
          name: 'Ciclano Pereira',
          email: 'ciclano@example.com',
          extension: '1002',
          status: 'on_call',
          currentCallNumber: '+55 11 98765-4321',
          callStartTime: new Date(Date.now() - 120000),
          isConnected: true,
        },
        {
          id: '3',
          name: 'Beltrano Santos',
          email: 'beltrano@example.com',
          extension: '1003',
          status: 'unavailable',
          isConnected: true,
        },
      ]
    },

    async createAgent(agentData: Partial<Agent>) {
      // TODO: Send create agent command to Asterisk
      console.log('Creating new agent:', agentData)

      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: agentData.name || '',
        email: agentData.email || '',
        extension: agentData.extension,
        status: 'offline',
        isConnected: false,
      }

      this.agents.push(newAgent)
      return newAgent
    },

    async updateAgent(agentId: string, agentData: Partial<Agent>) {
      // TODO: Send update agent command to Asterisk
      console.log('Updating agent:', agentId, agentData)

      const index = this.agents.findIndex(a => a.id === agentId)
      if (index !== -1) {
        this.agents[index] = { ...this.agents[index], ...agentData }
      }
    },

    async deleteAgent(agentId: string) {
      // TODO: Send delete agent command to Asterisk
      console.log('Deleting agent:', agentId)

      const index = this.agents.findIndex(a => a.id === agentId)
      if (index !== -1) {
        this.agents.splice(index, 1)
      }
    },

    async fetchAgentStats(agentId?: string) {
      // TODO: Fetch agent statistics from Asterisk/backend
      console.log('Fetching agent stats for:', agentId || 'current agent')

      // Mock data
      this.stats = {
        totalCalls: 145,
        answeredCalls: 132,
        missedCalls: 13,
        averageDuration: 245,
        todayCalls: 23,
      }
    },

    updateStats(stats: Partial<AgentStats>) {
      this.stats = { ...this.stats, ...stats }
    },
  },
})
