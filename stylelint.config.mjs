import {
  recommendedStylelintRules,
  stylelintPlugins,
} from './tooling/lint-plugin/dist/stylelint-rules.js';

export default {
  extends: ['stylelint-config-standard'],
  plugins: stylelintPlugins,
  ignoreFiles: ['**/node_modules/**', '**/*.d.ts'],
  rules: {
    ...recommendedStylelintRules,
    'custom-property-pattern': null,
    'custom-property-empty-line-before': null,
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--mth-/'] }],
    'alpha-value-notation': null,
    'color-function-notation': null,
    'hue-degree-notation': null,
    'lightness-notation': null,
    'no-empty-source': null,
  },
};
