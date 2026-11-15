# `@methane-ui/tokens`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

W3C Design Tokens Community Group (DTCG) design tokens, perceptual `oklch()` color ramps, automatic light/dark theming, density presets, reduced-motion overrides, and `forced-colors` high-contrast support for **Methane UI**.

- Zero runtime dependencies — ships precompiled CSS (`tokens.css`), raw DTCG JSON (`tokens.json`), and a standalone programmatic DTCG compiler (`@methane-ui/tokens/compiler`).
- All CSS custom properties live inside `@layer mth.tokens` so consumer utilities cleanly cascade over defaults.

## Installation

```bash
pnpm add @methane-ui/tokens
# or
npm install @methane-ui/tokens
```

## Package Exports

| Entrypoint | Purpose |
| --- | --- |
| `@methane-ui/tokens` | Precompiled `compiledTokens`, `tokensCss`, `dtcgSource`, typed `tokenVars` CSS variable map, and compiler helpers |
| `@methane-ui/tokens/tokens.css` | Prebuilt CSS stylesheet (`@layer mth.tokens`) defining `:root`, `[data-mth-theme]`, `[data-mth-density]`, reduced motion, and forced-colors rules |
| `@methane-ui/tokens/tokens.json` | Canonical W3C DTCG source JSON (`src/tokens.dtcg.json`) |
| `@methane-ui/tokens/compiler` | Standalone DTCG-to-CSS compiler (`compileDtcgTokens`, `pathToCssVar`, `toKebabCase`) |

## Quick Start

### Importing Prebuilt CSS

```css
/* Load cascade layer order first if using @methane-ui/css */
@import '@methane-ui/css/layers.css';
@import '@methane-ui/tokens/tokens.css';
```

Or in a TypeScript/bundler entrypoint:

```ts
import '@methane-ui/tokens/tokens.css';
import { tokenVars } from '@methane-ui/tokens';

// Reference strongly-typed CSS custom property names in JS/TS
document.documentElement.style.setProperty(
  tokenVars.color.seed.brand,
  'oklch(0.60 0.20 260)',
);
```

### Programmatic DTCG Compilation

```ts
import { compileDtcgTokens, pathToCssVar } from '@methane-ui/tokens/compiler';
import source from '@methane-ui/tokens/tokens.json' with { type: 'json' };

const { tokens, tokenMap, css } = compileDtcgTokens(source);
console.log(tokens.length, pathToCssVar('color.accent'), tokenMap['color.bg']);
```

## Token Architecture & Theming

Methane UI uses a **4-tier token cascade** built on CSS `oklch()` and relative color syntax:

1. **Tier 1 — Seed Tokens (`--mth-color-seed-*`)**: Brand, neutral, danger, warning, success, and info seeds. Override `--mth-color-seed-brand` on `:root` to re-theme the entire ramp.
2. **Tier 2 — Palette Scales (`--mth-color-brand-50..950`, `--mth-color-neutral-50..950`, `--mth-space-*`, `--mth-font-*`, `--mth-radius-*`, `--mth-shadow-*`, `--mth-motion-*`, `--mth-z-index-*`)**.
3. **Tier 3 — Semantic Roles**: Light/dark adaptive surfaces and foregrounds compiled via `light-dark(...)` and `com.methane.theme` extensions:
   - Surfaces: `--mth-color-bg`, `--mth-color-bg-subtle`, `--mth-color-surface`, `--mth-color-surface-raised`, `--mth-color-backdrop`
   - Foregrounds: `--mth-color-fg`, `--mth-color-fg-muted`, `--mth-color-fg-subtle`
   - Borders & Focus: `--mth-color-border`, `--mth-color-border-strong`, `--mth-color-border-focus`
   - Accents & Status: `--mth-color-accent`, `--mth-color-accent-hover`, `--mth-color-accent-active`, `--mth-color-accent-subtle`, `--mth-color-accent-fg`, `--mth-color-danger`, `--mth-color-warning`, `--mth-color-success`, `--mth-color-info`
4. **Tier 4 — Component Scoping**: Components read semantic tokens and expose local `--mth-<component>-*` variables.

### Theme & Density Selectors

```html
<!-- Explicit theme override (otherwise follows system prefers-color-scheme) -->
<html data-mth-theme="dark">
  <!-- Density presets: compact (0.8), default (1), comfortable (1.2) -->
  <section data-mth-density="compact">
    <!-- Scoped components use scaled --mth-space-control-* dimensions -->
  </section>
</html>
```

Equivalent class hooks `.mth-theme-light`, `.mth-theme-dark`, `.mth-density-compact`, `.mth-density-default`, and `.mth-density-comfortable` are also generated.

## Accessibility & System Preferences

- **`prefers-reduced-motion: reduce`**: Automatically collapses all compiled `duration` tokens (`--mth-motion-duration-*`) to `0ms`.
- **`forced-colors: active`**: Remaps semantic surface, foreground, border, accent, and status tokens to CSS system color keywords (`Canvas`, `CanvasText`, `GrayText`, `ButtonBorder`, `Highlight`, `HighlightText`, `LinkText`) and sets shadows to `none`.

## SSR Notes

- Pure CSS and pure JSON/TypeScript with no DOM globals required during compilation (`compileDtcgTokens` runs cleanly in Node, Edge runtimes, and browsers).

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
