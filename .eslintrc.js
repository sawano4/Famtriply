module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Ignore specific TypeScript errors during build
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }
    ],
    'react/no-unescaped-entities': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'public/',
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
  ],
};
