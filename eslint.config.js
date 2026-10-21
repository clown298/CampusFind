import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    // Vendored skill/tooling scripts (Impeccable, UI/UX Pro Max, agents) are
    // not app source and must not be linted with the app's rules.
    '.opencode/**',
    '.agents/**',
    '.trae/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Backend runs in Node as CommonJS; don't lint it with browser/ESM globals.
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: { ...globals.commonjs, ...globals.node },
      sourceType: 'commonjs',
    },
  },
  {
    // Context files intentionally export a Provider component plus a context/
    // hook pair from one file; this is the standard React pattern, so Fast
    // Refresh's "only-export-components" rule does not apply to them.
    files: ['src/context/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
