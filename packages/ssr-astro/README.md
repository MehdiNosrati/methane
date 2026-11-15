# `@methane-ui/ssr-astro`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Astro integration, server renderer, middleware, and island client hydration adapter for **Methane UI** — built on `@methane-ui/ssr`.

## Installation

```bash
pnpm add @methane-ui/ssr-astro @methane-ui/ssr @methane-ui/core
# or
npm install @methane-ui/ssr-astro @methane-ui/ssr @methane-ui/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane-ui/ssr-astro` | Astro Config / SSR | `createMethaneAstroIntegration`, `createMethaneAstroRenderer`, `createMethaneAstroMiddleware`, `renderAstroStaticMarkup`, `isMethaneAstroComponent` |
| `@methane-ui/ssr-astro/client` | Astro Client Islands | `initAstroHydration`, `hydrateAstroIsland`, `isAstroHydrationReady` |

## Usage Examples

### 1. Register Integration (`astro.config.mjs`)

```ts
import { defineConfig } from 'astro/config';
import { createMethaneAstroIntegration } from '@methane-ui/ssr-astro';

export default defineConfig({
  integrations: [
    createMethaneAstroIntegration({
      styles: 'linked',
      assetBase: '/_methane/styles',
    }),
  ],
});
```

### 2. Middleware or Static HTML Rendering

```ts
import { createMethaneAstroMiddleware, renderAstroStaticMarkup } from '@methane-ui/ssr-astro';

export const onRequest = createMethaneAstroMiddleware({ styles: 'linked' });

// Or manual component rendering
const { html } = await renderAstroStaticMarkup('<mth-badge>v1.0</mth-badge>');
```

### 3. Client Hydration

```ts
import { initAstroHydration, hydrateAstroIsland } from '@methane-ui/ssr-astro/client';

initAstroHydration();
hydrateAstroIsland(document.body);
```

## Notes

- Hoists deduplicated shadow stylesheet links into Astro `<head>` chunks automatically.
- Static layout/prose/marketing tags from `@methane-ui/css` render with zero Astro client island JavaScript.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
