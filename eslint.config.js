import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.wrangler', 'coverage']),

  // Base recommended rules for all JS
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // Frontend React app
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // Cloudflare Functions / Workers backend — lint very leniently
  // These are small handler files; we care more about security & correctness than style here.
  {
    files: ['functions/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.worker,
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      // Disable React rules entirely for backend
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // Be very permissive on backend handler code
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-constant-condition': 'off',

      // Allow common Worker patterns
      'no-prototype-builtins': 'off',
    },
  },
])
