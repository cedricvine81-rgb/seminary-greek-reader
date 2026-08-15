/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Stub Next's `server-only` marker so server modules can be unit-tested in node
    '^server-only$': '<rootDir>/tests/__mocks__/server-only.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  setupFiles: ['<rootDir>/tests/setup-jsdom.ts'],
  // Agent worktrees live under .claude/worktrees and are full checkouts, so without this
  // every suite runs twice — and jest-haste-map warns about the "duplicate" package.json
  // and mocks it finds in them.
  testPathIgnorePatterns: ['/node_modules/', '/.claude/', '/.next/'],
  transform: {
    // jsx: the project tsconfig uses Next's 'preserve', which ts-jest can't emit — component tests
    // need real JSX output. testEnvironment stays 'node' for the library tests; component tests opt
    // into jsdom with a `@jest-environment jsdom` docblock.
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
  },
}

module.exports = config
