export type { Role } from './auth'

export interface User {
  id: string
  firstName: string
  surname: string
  email: string
  role: import('./auth').Role
  institution?: string
  createdAt: string
}

export interface UserProfile extends User {
  enrolledCourses?: number
  completedAssignments?: number
  averageScore?: number
}
