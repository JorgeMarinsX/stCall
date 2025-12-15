export default defineNuxtPlugin(() => {
  const { globalToast } = useGlobalToast()
  const toast = useToast()

  if (toast) {
    globalToast.register(toast)
  }
})
