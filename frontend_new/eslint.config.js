import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// This is the standard "flat config" format. It's an array of configuration objects.
export default [
  // 1. Global ignores
  { ignores: ['dist/'] },

  // 2. Base ESLint recommended rules
  js.configs.recommended,

  // 3. TypeScript-specific configurations from typescript-eslint
  ...tseslint.configs.recommended,

  // 4. React-specific configurations
  {
    files: ['**/*.{ts,tsx}'], // Apply these rules only to TS/TSX files
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // This is crucial for React files
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y, // The accessibility plugin
    },
    rules: {
      // Rules from other plugins
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules, // <-- Applying the accessibility rules
      
      // Your custom rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];
