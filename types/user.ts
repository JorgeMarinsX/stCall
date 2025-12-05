export interface User {
  id: string
  name: string
  email: string
  role: 'agent' | 'admin' | 'supervisor'
  extension?: string
  avatar?: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'agent' | 'admin' | 'supervisor'
    extension: string
  }
}