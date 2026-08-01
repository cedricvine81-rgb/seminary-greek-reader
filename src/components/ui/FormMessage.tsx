import { CheckCircle2 } from 'lucide-react'

/**
 * The app's form feedback box — the success / error message under a settings
 * form (Profile, Password, Admin notifications). One component so the two
 * settings surfaces can't drift apart in padding, colour or icon again.
 *
 * Colours come from the themed `success`/`danger` tokens rather than literal
 * green-50 / red-50, which stayed bright on the Dim and Dark palettes.
 */
export function FormMessage({ kind, children }: {
  kind: 'success' | 'error'
  children: React.ReactNode
}) {
  if (kind === 'error') {
    return (
      <p role="alert" className="text-sm text-danger-fg bg-danger-bg rounded-lg p-3">
        {children}
      </p>
    )
  }
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-success-fg bg-success-bg rounded-lg p-3">
      <CheckCircle2 size={16} className="shrink-0" /> {children}
    </div>
  )
}
