'use client'
import { clsx } from 'clsx'
import type { Role } from '@/types/auth'
import { GraduationCap, BookOpen, type LucideIcon } from 'lucide-react'

interface RoleSelectorProps {
  value: Role
  onChange: (role: Role) => void
}

const roles: { value: Role; label: string; description: string; Icon: LucideIcon }[] = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Access courses, quizzes, and flashcards assigned by your instructor.',
    Icon: GraduationCap,
  },
  {
    value: 'INSTRUCTOR',
    label: 'Instructor',
    description: 'Create courses, build assignments, and track student progress.',
    Icon: BookOpen,
  },
]

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map(({ value: v, label, description, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={clsx(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-colors',
            value === v
              ? 'border-brand-600 bg-brand-50 text-brand-800'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          )}
        >
          <Icon size={24} />
          <span className="font-semibold text-sm">{label}</span>
          <span className="text-xs text-gray-500 leading-snug">{description}</span>
        </button>
      ))}
    </div>
  )
}
