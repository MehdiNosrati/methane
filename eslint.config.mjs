import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import {
  methaneEslintPlugin,
  recommendedEslintRules,
} from './tooling/lint-plugin/dist/index.js';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'PLAN.md'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@methane-ui': methaneEslintPlugin,
    },
    rules: {
      ...recommendedEslintRules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
