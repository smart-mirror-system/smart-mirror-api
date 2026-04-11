import js from '@eslint/js';
import globals from 'globals';

export default [
  // 1. Base Configuration for all JS files
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // Default to ESM
      globals: {
        ...globals.node, // Fixes 'process' errors in server.js, db.js, etc.
      },
    },
    rules: {
      'no-unused-vars': 'warn', // Changes errors to warnings for 'e', 'err', 'next'
      'no-undef': 'error',
    },
  },

  // 2. Specific Override for CommonJS files (if you use require/module.exports)
  {
    files: ['**/*.cjs', 'server.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },

  // 3. Specific Override for Jest Test Files
  {
    files: ['**/__tests__/**', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest, // 👈 This fixes 'test' and 'expect' errors
      },
    },
  },
];
