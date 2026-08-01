import { SelectHTMLAttributes, ReactNode, forwardRef } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: ReactNode
  error?: string
  /** Flat option list. Omit and pass `children` instead when you need optgroups. */
  options?: { value: string; label: string }[]
  /** Raw <option>/<optgroup> markup, for grouped lists. */
  children?: ReactNode
  placeholder?: string
  /** Help text under the field (e.g. the current selection spelled out). */
  hint?: ReactNode
}

/**
 * The app's select field. Renders its own chevron (`appearance-none`) rather than
 * the platform arrow, so the control looks the same in every browser and matches
 * the other form fields — the native arrow ignores the theme entirely.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, placeholder, hint, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={clsx(
            'w-full appearance-none rounded-lg border bg-input px-3 py-2 pr-9 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-400' : 'border-gray-300',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
      {hint && <div className="mt-1.5 text-xs text-gray-400">{hint}</div>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
)

Select.displayName = 'Select'
