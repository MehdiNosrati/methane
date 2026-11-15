# `@methane/css`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Zero-JS-byte Light-DOM CSS architecture for **Methane UI**: ordered CSS `@layer` stack, CSS logical-property reset, fail-open `:not(:defined)` FOUC guard, and pure-CSS layout, prose, and marketing primitives.

- **0 B client JavaScript** when using stylesheet imports directly.
- Pure CSS rules apply immediately to un-upgraded semantic custom tags (`<mth-stack>`, `<mth-grid>`, `<mth-hero>`, `<mth-prose>`, etc.) with zero Web Component hydration overhead.

## Installation

```bash
pnpm add @methane/css @methane/tokens
# or
npm install @methane/css @methane/tokens
```

## Exported Stylesheets & Constants

| Stylesheet / Export | Purpose |
| --- | --- |
| `@methane/css/index.css` | Combined bundle (`layers.css` + `reset.css` + `defined-guard.css` + `layout.css` + `prose.css` + `marketing.css`) |
| `@methane/css/base.css` | Essential core (`layers.css` + `reset.css` + `defined-guard.css`) without layout/marketing primitives |
| `@methane/css/layers.css` | Declares cascade order: `@layer mth.reset, mth.tokens, mth.primitives, mth.utilities;` |
| `@methane/css/reset.css` | Logical-property reset (`box-sizing`, margins, typographic rhythm, focus-visible defaults) inside `@layer mth.reset` |
| `@methane/css/defined-guard.css` | Fail-open `:not(:defined)` animation guard (`mth-defined-fallback`) preventing permanent FOUC if JS fails to load |
| `@methane/css/layout.css` | 11 layout primitives (`mth-stack`, `mth-grid`, `mth-flex`, `mth-container`, `mth-aspect-ratio`, `mth-sticky`, `mth-divider`, `mth-spacer`, `mth-app-shell`, `mth-sidebar-layout`, `mth-bento-grid`) |
| `@methane/css/prose.css` | Rich typography primitives (`mth-prose`, `mth-dl`) |
| `@methane/css/marketing.css` | 10 landing & editorial primitives (`mth-hero`, `mth-feature-grid`, `mth-testimonial`, `mth-logo-cloud`, `mth-footer`, `mth-faq`, `mth-article-layout`, `mth-pricing-table`, `mth-cta`, `mth-announcement-bar`) |
| `@methane/css` (JS/TS) | Typed metadata arrays (`MTH_CASCADE_LAYERS`, `MTH_CSS_PRIMITIVES`, `MTH_LAYOUT_PRIMITIVES`, `MTH_TYPOGRAPHY_PRIMITIVES`, `MTH_MARKETING_PRIMITIVES`, `MTH_UNUPGRADED_TAG_PRIMITIVES`, `LAYER_ORDER_DECLARATION`) |

## Usage Examples

### Stylesheet Setup

```css
/* Recommended load order */
@import '@methane/css/layers.css';
@import '@methane/tokens/tokens.css';
@import '@methane/css/reset.css';
@import '@methane/css/defined-guard.css';
@import '@methane/css/layout.css';
@import '@methane/css/prose.css';
@import '@methane/css/marketing.css';

/* Or single combined bundle (place after @layer order / tokens) */
@import '@methane/tokens/tokens.css';
@import '@methane/css/index.css';
```

### Pure-CSS Layout & Marketing Primitives in HTML

```html
<mth-container>
  <mth-stack data-gap="6">
    <mth-hero>
      <h1>Build accessible design systems faster</h1>
      <p>Zero-JS layout primitives paired with Lit 3 custom elements.</p>
    </mth-hero>

    <mth-grid data-cols="3" data-gap="4">
      <mth-bento-grid>...</mth-bento-grid>
    </mth-grid>

    <mth-prose>
      <h2>Long-form Documentation</h2>
      <p>Styled automatically via <code>--mth-*</code> typography tokens.</p>
    </mth-prose>
  </mth-stack>
</mth-container>
```

## Cascade Layers, Theming & SSR Notes

- **Cascade Layers**: `mth.reset` < `mth.tokens` < `mth.primitives` < `mth.utilities`. Any unlayered consumer CSS (or Tailwind `@layer utilities`) overrides primitives predictably without `!important`.
- **Theming**: Primitives read `--mth-space-*`, `--mth-color-*`, `--mth-radius-*`, and `--mth-font-*` directly from `@methane/tokens` and use CSS logical properties (`margin-block`, `padding-inline`, `inset-inline-start`) for automatic RTL mirroring.
- **FOUC Protection & SSR**: `defined-guard.css` hides `:not(:defined)` interactive elements briefly (`100ms`) with a fail-open animation so SSR pages never flash unstyled controls *and* never get stuck invisible if a script fails.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
