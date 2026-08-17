import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-undef': 'off', // TypeScript handles this
      // Stond op 'error', maar CI maskeerde lint-fouten met `|| echo`, dus dit
      // is nooit afgedwongen: er staan 19 overtredingen, vrijwel allemaal
      // grens-typering van de Chrome-API (storageAdapter, polyfill). Die code
      // wordt vervangen bij de migratie naar @rolodink/core; tot die tijd
      // zichtbaar als waarschuwing, bewaakt door --max-warnings in het script.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off', // Use TypeScript version instead
    },
  },
  // Plain JavaScript, which until now matched no config block at all: the block
  // above is scoped to **/*.{ts,tsx}, so `eslint src/content/main.js` exited 0
  // without reading a single rule. The content script — the most
  // user-visible code in the product, running in the DOM of every profile
  // page — was the one file with no linting whatsoever.
  //
  // That cost us. injectCRMButton referenced `entryPointWrapper`, a variable
  // whose definition was removed when the dead `.entry-point` lookup went, and
  // the two lines using it stayed behind. It threw a ReferenceError on every
  // MutationObserver tick, before the button was ever inserted, so the button
  // never appeared for anyone. Nothing caught it: not the build (a bundler does
  // not resolve globals), not typecheck (the file is .js), not the tests (they
  // cover anchors.ts, not this), and not lint.
  //
  // no-undef is the rule that catches it, and it is on here for exactly the
  // reason it is off above: TypeScript does that job for .ts files, and nothing
  // was doing it for .js ones.
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
]
