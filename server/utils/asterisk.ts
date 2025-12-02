/**
 * Server-side utility for Asterisk ARI (Asterisk REST Interface) HTTP API
 *
 * This utility provides methods to make REST API calls to Asterisk ARI
 * for call commands (originate, answer, hangup, hold, transfer, etc.)
 *
 * Architecture Note:
 * - WebSocket events come from a separate WS Container (not handled here)
 * - This utility only handles HTTP REST commands to Asterisk
 * - Server API → Asterisk ARI REST API
 */

export interface AriConfig {
  host: string
  port: string
  username: string
  password: string
}

/**
 * Get ARI configuration from runtime config
 */
export const getAriConfig = (): AriConfig => {
  const config = useRuntimeConfig()

  return {
    host: config.public.asteriskHost,
    port: config.public.asteriskAriPort,
    username: config.asteriskUsername,
    password: config.asteriskPassword,
  }
}

/**
 * Build ARI REST API URL
 */
export const buildAriUrl = (endpoint: string): string => {
  const ariConfig = getAriConfig()
  return `http://${ariConfig.host}:${ariConfig.port}/ari/${endpoint}`
}

/**
 * Make a REST API call to Asterisk ARI
 *
 * @param endpoint - API endpoint (e.g., 'channels', 'bridges')
 * @param options - Fetch options (method, body, etc.)
 */
export const ariCall = async <T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: any
    headers?: Record<string, string>
  } = {}
): Promise<T> => {
  const ariConfig = getAriConfig()
  const url = buildAriUrl(endpoint)

  // Add basic auth header
  const auth = Buffer.from(`${ariConfig.username}:${ariConfig.password}`).toString('base64')
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  console.log('ARI Request:', {
    url,
    method: options.method || 'GET',
    username: ariConfig.username,
  })

  try {
    const response = await $fetch(url, {
      method: options.method || 'GET',
      body: options.body,
      headers,
    })

    return response as T
  } catch (error: any) {
    console.error('ARI API call failed:', {
      endpoint,
      url,
      error: error.message,
      status: error.statusCode,
      data: error.data,
    })
    throw error
  }
}

/**
 * Get all channels
 */
export const getChannels = async () => {
  return await ariCall('channels', { method: 'GET' })
}

/**
 * Get a specific channel
 */
export const getChannel = async (channelId: string) => {
  return await ariCall(`channels/${channelId}`, { method: 'GET' })
}

/**
 * Originate a new outbound call
 *
 * @param endpoint - Channel endpoint (e.g., 'PJSIP/1001')
 * @param extension - Extension to dial
 * @param context - Dialplan context (default: 'default')
 * @param callerId - Caller ID to use (optional)
 */
export const originateCall = async (
  endpoint: string,
  extension: string,
  context: string = 'default',
  callerId?: string
) => {
  const params = new URLSearchParams({
    endpoint,
    extension,
    context,
    app: 'stCall', // Stasis application name
    ...(callerId && { callerId }),
  })

  return await ariCall(`channels?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Answer a channel
 */
export const answerCall = async (channelId: string) => {
  return await ariCall(`channels/${channelId}/answer`, {
    method: 'POST',
  })
}

/**
 * Hangup a channel
 */
export const hangupCall = async (channelId: string, reason: string = 'normal') => {
  const params = new URLSearchParams({ reason })
  return await ariCall(`channels/${channelId}?${params.toString()}`, {
    method: 'DELETE',
  })
}

/**
 * Ring a channel (make it ring)
 */
export const ringChannel = async (channelId: string) => {
  return await ariCall(`channels/${channelId}/ring`, {
    method: 'POST',
  })
}

/**
 * Stop ringing a channel
 */
export const stopRingChannel = async (channelId: string) => {
  return await ariCall(`channels/${channelId}/ring`, {
    method: 'DELETE',
  })
}

/**
 * Mute a channel
 * @param direction - 'in' (mute incoming), 'out' (mute outgoing), 'both'
 */
export const muteChannel = async (
  channelId: string,
  direction: 'in' | 'out' | 'both' = 'out'
) => {
  const params = new URLSearchParams({ direction })
  return await ariCall(`channels/${channelId}/mute?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Unmute a channel
 * @param direction - 'in', 'out', 'both'
 */
export const unmuteChannel = async (
  channelId: string,
  direction: 'in' | 'out' | 'both' = 'out'
) => {
  const params = new URLSearchParams({ direction })
  return await ariCall(`channels/${channelId}/unmute?${params.toString()}`, {
    method: 'DELETE',
  })
}

/**
 * Hold a channel (start music on hold)
 */
export const holdChannel = async (channelId: string) => {
  return await ariCall(`channels/${channelId}/hold`, {
    method: 'POST',
  })
}

/**
 * Unhold a channel (stop music on hold)
 */
export const unholdChannel = async (channelId: string) => {
  return await ariCall(`channels/${channelId}/hold`, {
    method: 'DELETE',
  })
}

/**
 * Send DTMF to a channel
 */
export const sendDtmf = async (channelId: string, dtmf: string, duration?: number) => {
  const params = new URLSearchParams({
    dtmf,
    ...(duration && { duration: duration.toString() }),
  })
  return await ariCall(`channels/${channelId}/dtmf?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Redirect a channel to a different extension
 */
export const redirectChannel = async (
  channelId: string,
  extension: string,
  context: string = 'default'
) => {
  const params = new URLSearchParams({ endpoint: extension, context })
  return await ariCall(`channels/${channelId}/redirect?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Get all bridges
 */
export const getBridges = async () => {
  return await ariCall('bridges', { method: 'GET' })
}

/**
 * Create a new bridge
 */
export const createBridge = async (type: string = 'mixing') => {
  const params = new URLSearchParams({ type })
  return await ariCall(`bridges?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Add a channel to a bridge
 */
export const addChannelToBridge = async (bridgeId: string, channelId: string) => {
  const params = new URLSearchParams({ channel: channelId })
  return await ariCall(`bridges/${bridgeId}/addChannel?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Remove a channel from a bridge
 */
export const removeChannelFromBridge = async (bridgeId: string, channelId: string) => {
  const params = new URLSearchParams({ channel: channelId })
  return await ariCall(`bridges/${bridgeId}/removeChannel?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Destroy a bridge
 */
export const destroyBridge = async (bridgeId: string) => {
  return await ariCall(`bridges/${bridgeId}`, {
    method: 'DELETE',
  })
}

/**
 * Play audio to a channel
 */
export const playAudio = async (
  channelId: string,
  media: string,
  lang: string = 'en'
) => {
  const params = new URLSearchParams({ media, lang })
  return await ariCall(`channels/${channelId}/play?${params.toString()}`, {
    method: 'POST',
  })
}

/**
 * Start recording a channel
 */
export const startRecording = async (
  channelId: string,
  name: string,
  format: string = 'wav'
) => {
  const params = new URLSearchParams({ name, format })
  return await ariCall(`channels/${channelId}/record?${params.toString()}`, {
    method: 'POST',
  })
}
