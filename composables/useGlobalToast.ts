/**
 * useGlobalToast - Wrapper composable for the global toast manager
 *
 * @description
 * Provides access to the global toast manager and automatically registers
 * the PrimeVue toast instance when used in a component context.
 *
 * This allows toast notifications to work both inside and outside Vue component context.
 *
 * @example
 * ```typescript
 * // In a component
 * const { globalToast } = useGlobalToast()
 * globalToast.success('Success!', 'Operation completed')
 *
 * // In a store (outside component context)
 * import { globalToast } from '~/utils/toastManager'
 * globalToast.error('Error!', 'Something went wrong')
 * ```
 */

import { globalToast } from '~/utils/toastManager'
import { onMounted, onUnmounted } from 'vue'

export function useGlobalToast() {
  // Try to get the PrimeVue toast instance if in component context
  let primeToast: any = null

  try {
    // This will only work if we're in a component context
    primeToast = useToast()

    // Register it with the global manager on mount
    onMounted(() => {
      if (primeToast) {
        globalToast.register(primeToast)
      }
    })

    // Unregister on unmount
    onUnmounted(() => {
      globalToast.unregister()
    })
  } catch (e) {
    // Not in component context - that's okay, we can still use globalToast directly
    console.debug('[useGlobalToast] Not in component context, using global toast directly')
  }

  return {
    globalToast,
    // Also expose the PrimeVue toast instance if available
    toast: primeToast
  }
}
