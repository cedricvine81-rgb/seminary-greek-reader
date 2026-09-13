// Flat config (ESLint 9). Next 16 removed `next lint`, so the build gate runs eslint
// directly via the "lint" script, chained into "build" — see package.json.
import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  {
    rules: {
      // Literal quotes/apostrophes in prose are house style — this rule is pure noise here.
      'react/no-unescaped-entities': 'off',
      // The react-hooks v6 rules that shipped with config-next 16 grade existing, working
      // patterns (setState-in-effect, ref conventions) — valuable advice, but 200+ sites of
      // it landed at once with the Next 16 upgrade. Warnings, not deploy blockers; tighten
      // rule by rule as the sites get cleaned. rules-of-hooks itself stays an error.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      // ignoreNonDOM: role= on a custom component (DashboardShell role="ADMIN") is a plain
      // prop, not an ARIA role.
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      // The rule that catches unnamed icon-only controls — the 2026-09 a11y pass worked
      // this inventory to zero; keep it that way.
      'jsx-a11y/control-has-associated-label': ['warn', { ignoreElements: ['input', 'select', 'textarea'] }],
    },
  },
  {
    // These files hand JSX to MorphTable/ColsTable inside `rows` prop arrays; the consumer
    // keys every <tr>/<td> itself (shared.tsx), so react/jsx-key false-positives here.
    files: ['src/components/morphology/chapters/*.tsx'],
    rules: { 'react/jsx-key': 'off' },
  },
  { ignores: ['.next/**', 'node_modules/**', '.claude/**', 'scripts/**', 'public/**'] },
]
