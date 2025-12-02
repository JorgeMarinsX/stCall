/**
 * Test endpoint to verify Asterisk ARI connection
 * GET /api/asterisk/test
 */

import { getAriConfig, getChannels } from '~/server/utils/asterisk'

export default defineEventHandler(async (event) => {
  try {
    const config = getAriConfig()

    console.log('Testing Asterisk ARI connection:', {
      host: config.host,
      port: config.port,
      username: config.username,
    })

    // Try to get all active channels
    const channels = await getChannels()

    return {
      success: true,
      message: 'Successfully connected to Asterisk ARI',
      config: {
        host: config.host,
        port: config.port,
        username: config.username,
      },
      channels: channels || [],
      channelCount: Array.isArray(channels) ? channels.length : 0,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error('Asterisk ARI connection test failed:', error)

    return {
      success: false,
      message: 'Failed to connect to Asterisk ARI',
      error: error.message || 'Unknown error',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
    }
  }
})
