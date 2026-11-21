import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.browser },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
    },
  },
  { files: ['sw.js'], languageOptions: { globals: globals.serviceworker } },
  // Classic script that must run in old browsers too.
  { files: ['assets/landing.js'], languageOptions: { sourceType: 'script' }, rules: { 'no-var': 'off' } },
  { files: ['scripts/**', 'test/**', '*.config.js'], languageOptions: { globals: globals.node } },
];
