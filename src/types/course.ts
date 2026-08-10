export type CourseLevel = 'BEGINNING' | 'INTERMEDIATE' | 'ADVANCED' | 'GREEK_I' | 'GREEK_II' | 'GREEK_III' | 'SEPTUAGINT'

export interface Course {
  id: string
  name: string
  listing?: string | null
  level: CourseLevel
  institutionName?: string | null
  startDate: string
  endDate: string
  institutionId?: string
  instructorId: string
  createdAt: string
  updatedAt: string
  enrollmentCount?: number
  assignmentCount?: number
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  createdAt: string
}

export interface CourseFormData {
  name: string
  listing?: string
  level: CourseLevel
  /** The language all ASSESSMENT in this course is set and marked in. Students may still revise
   *  in any interface language — only the answer key follows the course. */
  language?: string
  startDate: string
  endDate: string
  institutionName?: string
}
