'use client'
import { clsx } from 'clsx'
import type { Role } from '@/types/auth'
import { GraduationCap, BookOpen, type LucideIcon } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

interface RoleSelectorProps {
  value: Role
  onChange: (role: Role) => void
}

const roles: { value: Role; labelKey: string; descKey: string; Icon: LucideIcon }[] = [
  { value: 'STUDENT',    labelKey: 'auth.role.student',    descKey: 'auth.role.studentDesc',    Icon: GraduationCap },
  { value: 'INSTRUCTOR', labelKey: 'auth.role.instructor', descKey: 'auth.role.instructorDesc', Icon: BookOpen },
]

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const t = useT()
  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map(({ value: v, labelKey, descKey, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={clsx(
            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-colors',
            value === v
              ? 'border-brand-600 bg-brand-50 text-brand-800'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          )}
        >
          <Icon size={24} />
          <span className="font-semibold text-sm">{t(labelKey)}</span>
          <span className="text-xs text-gray-500 leading-snug">{t(descKey)}</span>
        </button>
      ))}
    </div>
  )
}
