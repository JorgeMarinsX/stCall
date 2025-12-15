/**
 * Runtime config type definitions for stCall
 * Extends Nuxt's RuntimeConfig to include our custom configuration
 */
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    // Private runtime config (server-side only)
    asteriskUsername: string
    asteriskPassword: string
  }

  interface PublicRuntimeConfig {
    // Public runtime config (exposed to client)
    asteriskHost: string
    asteriskAmiPort: string
    asteriskAriPort: string
    asteriskWsPort: string
    apiBaseUrl: string
    wsUrl: string

    // WebRTC Configuration
    webrtcWssUrl: string
    webrtcDomain: string
    webrtcStunServer: string
    webrtcTurnServer: string
    webrtcTurnUsername: string
    webrtcTurnPassword: string
  }
}

export {}
