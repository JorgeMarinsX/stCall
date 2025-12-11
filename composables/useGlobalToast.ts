import { globalToast } from '~/utils/toastManager'
import { onMounted, onUnmounted } from 'vue'

export function useGlobalToast() {
  let primeToast: any = null

  try {
    primeToast = useToast()

    onMounted(() => {
      if (primeToast) {
        globalToast.register(primeToast)
      }
    })

    onUnmounted(() => {
      globalToast.unregister()
    })
  } catch (e) {
    console.debug('[useGlobalToast] Not in component context, using global toast directly')
  }

  return {
    globalToast,
    toast: primeToast
  }
}