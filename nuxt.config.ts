import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: ['@primevue/nuxt-module'],
  
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false
      }
      },

      ripple: true,
      inputVariant: 'filled'
    },
  },
  
  css: ['primeicons/primeicons.css'],
  
  typescript: {
    strict: true,
    typeCheck: true
  },

  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 24678,
        clientPort: 24678
      },
      watch: {
        usePolling: true
      }
    }
  },

  compatibilityDate: '2024-11-18'
})