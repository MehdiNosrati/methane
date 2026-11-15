---
name: methane-theming
description: Customizes Methane UI themes using OKLCH brand seeds, light/dark modes, density presets, high-contrast forced-colors, W3C DTCG tokens.json compilation, and ::part() or :state() styling. Use when theming or styling @methane-ui/* components.
---

# Methane Theming & Tokens

Methane derives perceptual color ramps and semantic tokens in `oklch()` inside `@layer mth.tokens` (`mth.reset < mth.tokens < mth.primitives < mth.utilities`).

## 1. Load Order

Import layers, tokens, and base CSS in order so your own stylesheets override primitives without `!important`:

```css
@import '@methane-ui/css/layers.css';
@import '@methane-ui/tokens/tokens.css';
@import '@methane-ui/css/index.css';
```

## 2. Customize Brand Color in OKLCH

Override `--mth-color-seed-brand` (default `oklch(0.55 0.23 264)`) to regenerate your brand palette and accent tokens:

```css
:root {
  --mth-color-seed-brand: oklch(0.58 0.21 195);
  /* Optional semantic seeds: --mth-color-seed-neutral, -danger, -warning, -success, -info */
}
```

When overriding `--mth-color-seed-brand` inside a scoped subtree, also re-declare derived ramp tokens (`--mth-color-brand-50..950`, `--mth-color-accent`, `--mth-color-accent-subtle`) if components inside that subtree rely on inherited custom properties.

## 3. Switch Light / Dark & Density

Apply attributes or helper classes on `<html>` or any container subtree:

- **Theme mode**: `data-mth-theme="light" | "dark"` (or `.mth-theme-light` / `.mth-theme-dark`). Without an attribute, `:root` uses `color-scheme: light dark` and `light-dark()` automatically.
- **Spacing density**: `data-mth-density="compact" | "default" | "comfortable"` (or `.mth-density-compact` / `.mth-density-default` / `.mth-density-comfortable`), scaling `--mth-density` between `0.8`, `1`, and `1.2`.

```html
<html data-mth-theme="dark" data-mth-density="compact"></html>
```

## 4. High Contrast (`forced-colors`) & Reduced Motion

`@methane-ui/tokens/tokens.css` automatically handles accessibility media queries:

- `@media (forced-colors: active)` maps `--mth-color-bg` / `--mth-color-surface` to `Canvas`, `--mth-color-fg` to `CanvasText`, `--mth-color-border` to `ButtonBorder`, `--mth-color-accent` / `--mth-color-border-focus` to `Highlight`, and clears shadows.
- `@media (prefers-reduced-motion: reduce)` sets all `--mth-motion-duration-*` tokens to `0ms`.

## 5. Compile Custom W3C DTCG `tokens.json`

Use `@methane-ui/tokens/compiler` to compile custom DTCG JSON documents into `--mth-*` CSS:

```ts
import { compileDtcgTokens, type DtcgDocument } from '@methane-ui/tokens/compiler';

const dtcg: DtcgDocument = {
  color: {
    $type: 'color',
    seed: { brand: { $value: 'oklch(0.58 0.19 195)' } },
  },
};

const { css, tokens, tokenMap } = compileDtcgTokens(dtcg);
```

## 6. Style Shadow DOM with `::part()`, `:state()`, and `registerStyles`

Never reach across Shadow DOM with fragile selectors. Use the public styling tiers:

- **Tokens**: Override `--mth-radius-md`, `--mth-color-surface`, `--mth-font-sans`, etc.
- **Parts & States**: Target exposed parts (`::part(base)`, `::part(control)`, `::part(label)`, `::part(popup)`) and `CustomStateSet` pseudo-classes (`:state(disabled)`, `:state(invalid)`, `:state(open)`, `:state(checked)`, `:state(loading)`):

```css
mth-button::part(control) {
  letter-spacing: 0.01em;
}

mth-input:state(user-invalid)::part(control) {
  border-color: var(--mth-color-danger);
}
```

- **Constructable Sheet Escape Hatch**: Inject scoped Constructable Stylesheets into `@layer override` via `@methane-ui/core`:

```ts
import { registerStyles } from '@methane-ui/core';

registerStyles('mth-button', '@layer override { [part="control"] { font-weight: 700; } }');
```
