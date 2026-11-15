# `@methane-ui/react`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Typed React 19 native Custom Elements JSX definitions and React 18 `@lit/react` wrapper components covering all `@methane-ui/*` custom elements (`@methane-ui/ui`, domain kits, primitives, and satellites).

## Installation

```bash
pnpm add @methane-ui/react @methane-ui/ui @methane-ui/core
# or
npm install @methane-ui/react @methane-ui/ui @methane-ui/core
```

> **Peer dependency:** `react` (`^18.0.0 || ^19.0.0`). Import element definitions from `@methane-ui/ui/*`, `@methane-ui/ai`, etc. (or use `@methane-ui/primitives` `AutoLoader`) so the custom elements are registered at runtime.

## Package Exports

| Entrypoint | Target | Description |
| --- | --- | --- |
| `@methane-ui/react` | React 19+ | Augments React's `JSX.IntrinsicElements` (`declare module 'react'`) with typed properties, DOM element interfaces (`MthButtonElement`), custom event callbacks (`onmth-change`), and `MethaneReactTagNameMap` |
| `@methane-ui/react/legacy` | React 18 | Exports `@lit/react` `createComponent()` React components (`MthButton`, `MthDialog`, `MthChart`, etc.) mapping `mth-*` custom events to camelCase React handlers |

## Usage Examples

### React 19 (Native Custom Element JSX Support)

```tsx
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import '@methane-ui/react'; // activates JSX IntrinsicElements augmentation
import { useState } from 'react';

export function ProfileForm() {
  const [name, setName] = useState('');

  return (
    <mth-input
      value={name}
      placeholder="Display name"
      onmth-input={(e) => setName((e.target as HTMLInputElement).value)}
    />
  );
}
```

### React 18 (`@methane-ui/react/legacy`)

```tsx
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import { MthButton, MthDialog } from '@methane-ui/react/legacy';
import { useState } from 'react';

export function ConfirmDelete() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MthButton variant="danger" onClick={() => setOpen(true)}>
        Delete
      </MthButton>
      <MthDialog open={open} label="Confirm delete" onMthClose={() => setOpen(false)}>
        <p>This action cannot be undone.</p>
      </MthDialog>
    </>
  );
}
```

## Theming, A11y & SSR Notes

- **Theming**: Style custom elements via `--mth-*` tokens and `::part(...)` selectors in CSS as usual.
- **Accessibility**: Native `<mth-*>` DOM semantics, ARIA attributes, and form participation work identically in React 18 and React 19.
- **SSR (Next.js App Router)**: Pair with `@methane-ui/ssr-next` so Declarative Shadow DOM renders on the server and upgrades cleanly during React hydration.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
