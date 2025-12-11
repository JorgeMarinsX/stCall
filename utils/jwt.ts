import { useCommandExecutor } from '~/composables/utils/useCommandExecutor'

export interface JWTPayload {
  exp?: number
  iat?: number
  [key: string]: any
}

const { execute } = useCommandExecutor()

export async function decodeJWT(token: string): Promise<JWTPayload | null> {
  return await execute({
    action: async () => {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      return JSON.parse(atob(parts[1]))
    },
    showErrorToast: false,
    rethrow: false
  })
}

export async function isTokenExpired(token: string): Promise<boolean | null> {
  const payload = await decodeJWT(token)
  if (!payload || !payload.exp) return null
  return payload.exp < Math.floor(Date.now() / 1000)
}

export async function getTokenExpiration(token: string): Promise<number | null> {
  const payload = await decodeJWT(token)
  return payload?.exp || null
}

export async function parseTokenPayload(token: string): Promise<JWTPayload | null> {
  return await decodeJWT(token)
}

export async function isTokenValid(token: string): Promise<boolean> {
  if (!token) return false
  const payload = await decodeJWT(token)
  if (!payload) return false
  const expired = await isTokenExpired(token)
  return expired === false
}