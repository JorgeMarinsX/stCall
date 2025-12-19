import stCallTheme from './theme.config';

export default defineNuxtConfig({
  devtools: { enabled: true },
  debug: true,

  runtimeConfig: {
    // Private keys (server-side only)
    asteriskUsername: process.env.ASTERISK_USERNAME || 'stcall',
    asteriskPassword: process.env.ASTERISK_PASSWORD || 'stcall',

    // Public keys (exposed to client)
    public: {
      asteriskHost: process.env.ASTERISK_HOST || 'localhost',
      asteriskAmiPort: process.env.ASTERISK_AMI_PORT || '5038',
      asteriskAriPort: process.env.ASTERISK_ARI_PORT || '8088',
      asteriskWsPort: process.env.ASTERISK_WS_PORT || '8088',
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
      wsUrl: process.env.WS_URL || 'ws://localhost:3001',

      // WebRTC Configuration
      webrtcWssUrl: process.env.WEBRTC_WSS_URL || '',
      webrtcDomain: process.env.WEBRTC_DOMAIN || '',
      webrtcStunServer: process.env.WEBRTC_STUN_SERVER || 'stun:stun.l.google.com:19302',
      webrtcTurnServer: process.env.WEBRTC_TURN_SERVER || '',
      webrtcTurnUsername: process.env.WEBRTC_TURN_USERNAME || '',
      webrtcTurnPassword: process.env.WEBRTC_TURN_PASSWORD || '',
    }
  },

  modules: ['@primevue/nuxt-module', '@nuxt/devtools', '@nuxtjs/tailwindcss', '@pinia/nuxt'],

  // Configure auto-imports to scan composables subdirectories
  imports: {
    dirs: [
      'composables/**'
    ]
  },

  primevue: {
    options: {
      theme: {
        preset: stCallTheme,
        options: {
          prefix: 'p',
          darkModeSelector: '.stcall-dark-mode',
          cssLayer: false
      }
      },

      ripple: true,
      inputVariant: 'filled'
    },
  },
  
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/tailwind.css'
  ],
  
  typescript: {
    strict: true,
    typeCheck: true
  },

  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 3000,
        clientPort: 3000
      },
      watch: {
        usePolling: true
      }
    }
  },
  compatibilityDate: '2024-11-18',
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head:{
      title: 'stCall - Callcenter Software',
      meta:[
        {name: 'viewport', content: 'width=device-width, initial-scale=1'},
        {charset: 'utf-8'},
      ],
      link:[
        {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}
      ],
      script: [
        {
          innerHTML: '(function(){try{if(localStorage.getItem("dark_mode")==="true")document.documentElement.classList.add("stcall-dark-mode")}catch(e){}})();'
        }
      ]
    }
  }

})