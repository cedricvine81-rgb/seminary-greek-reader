export type Role = 'INSTRUCTOR' | 'STUDENT'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  surname: string
  role: Role
  institution?: string
}

export interface SignUpPayload {
  firstName: string
  surname: string
  email: string
  password: string
  institution?: string
  role: Role
}

export interface SignInPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface JWTPayload {
  sub: string
  email: string
  role: Role
  iat?: number
  exp?: number
}
