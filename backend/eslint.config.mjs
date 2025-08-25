import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['**/node_modules/**', 'dist/**', 'build/**'],
  },
  
  // Base JavaScript config
  js.configs.recommended,
  
  // TypeScript configs
  ...tseslint.configs.recommended,
  
  // Custom rules
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
);
