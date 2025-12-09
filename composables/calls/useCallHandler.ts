import { useAgentConnection } from '~/composables/agent/useAgentConnection'
import { useCallLifecycle } from '~/composables/calls/useCallLifecycle'
import { useCallControls } from '~/composables/calls/useCallControls'

export const useCallHandler = () => {
  // Import specialized composables
  const agentConnection = useAgentConnection()
  const callLifecycle = useCallLifecycle()
  const callControls = useCallControls()

  // Re-export all methods through a single interface
  return {
    // Agent connection methods
    ...agentConnection,

    // Call lifecycle methods
    ...callLifecycle,

    // Call control methods
    ...callControls,
  }
}
