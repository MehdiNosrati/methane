# `@methane-ui/lint-plugin`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

ESLint and Stylelint architectural invariant rules for **Methane UI** — enforcing package layer boundaries, Shadow DOM logical CSS rules, `:host` token encapsulation, and accessibility safety invariants across component authoring.

## Installation

```bash
pnpm add -D @methane-ui/lint-plugin
# or
npm install -D @methane-ui/lint-plugin
```

## Package Exports

| Entrypoint | Purpose |
| --- | --- |
| `@methane-ui/lint-plugin` | Combined ESLint plugin, Stylelint plugins, CSS analyzers, and recommended configs |
| `@methane-ui/lint-plugin/eslint` | ESLint plugin (`methaneEslintPlugin`), individual rule exports, and `recommendedEslintRules` |
| `@methane-ui/lint-plugin/stylelint` | Stylelint plugins (`stylelintPlugins`) and `recommendedStylelintRules` |

## Exported Rules & Guardrails

### ESLint Rules (`@methane-ui/lint-plugin/eslint`)

| Rule / Helper | Enforced Invariant |
| --- | --- |
| `noRawHtml` | Disallows raw HTML sinks in favor of `@methane-ui/sanitize` helpers (`safeSetHTML`, `safeSetMarkdown`) |
| `noCrossComponentInternalImports` | Prevents deep relative imports into another component's private implementation files |
| `noCssViolationsInLit` | Validates `css\`...\`` tagged templates for `:host-context()` and non-logical CSS properties |
| `noDelegatesFocusWithHostRole` | Prevents mixing `shadowRootOptions = { delegatesFocus: true }` with a conflicting host `role` |
| `noHostDisabledInFormDisabledCallback` | Guards against invalid host attribute mutation inside `formDisabledCallback` |
| `noTabindexInConstructor` | Ensures `tabindex` is not mutated in element constructors (which breaks HTML parser / SSR upgrade) |
| `PACKAGE_LAYER_ORDER`, `detectImportCycles`, `isAllowedPackageEdge` | Dependency graph validation helpers across layers 0–3b |

### Stylelint Rules (`@methane-ui/lint-plugin/stylelint`)

| Rule Constant | Description |
| --- | --- |
| `LOGICAL_PROPERTIES_ONLY_RULE` | Enforces CSS logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, etc.) for automatic RTL parity |
| `NO_HOST_CONTEXT_RULE` | Bans non-standard/slow `:host-context(...)` selectors in favor of `@lit/context` |
| `NO_HOST_PUBLIC_TOKEN_SEED_RULE` | Prevents overriding public `--mth-*` seed variables on `:host` |

## Usage Examples

### ESLint Flat Config (`eslint.config.js`)

```js
import { methaneEslintPlugin, recommendedEslintRules } from '@methane-ui/lint-plugin/eslint';

export default [
  {
    plugins: {
      '@methane-ui': methaneEslintPlugin,
    },
    rules: {
      ...recommendedEslintRules,
    },
  },
];
```

### Stylelint Config (`stylelint.config.js`)

```js
import { stylelintPlugins, recommendedStylelintRules } from '@methane-ui/lint-plugin/stylelint';

export default {
  plugins: stylelintPlugins,
  rules: {
    ...recommendedStylelintRules,
  },
};
```

## Notes

- Runs in Node.js lint/CI pipelines alongside ESLint (`^10.15.0`) and Stylelint (`^18.0.0`).

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
