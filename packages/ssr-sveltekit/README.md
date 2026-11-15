# `@methane/ssr-sveltekit`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

SvelteKit server `handle` hook for Declarative Shadow DOM (DSD) expansion and client hydration adapter for **Methane UI** — built on `@methane/ssr`.

## Installation

```bash
pnpm add @methane/ssr-sveltekit @methane/ssr @methane/svelte @methane/core
# or
npm install @methane/ssr-sveltekit @methane/ssr @methane/svelte @methane/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane/ssr-sveltekit` | SvelteKit Server (`hooks.server.ts`) | `createMethaneHandle`, `transformSvelteKitHtml` |
| `@methane/ssr-sveltekit/client` | Client (`hooks.client.ts` / layout) | `initSvelteKitHydration`, `hydrateSvelteKitRoot`, `isSvelteKitHydrationReady` |

## Usage Examples

### 1. Server Hook (`src/hooks.server.ts`)

```ts
import '@methane/ssr/dom-shim';
import '@methane/ui/button';
import { createMethaneHandle } from '@methane/ssr-sveltekit';

export const handle = createMethaneHandle({
  styles: 'linked',
  assetBase: '/_methane/styles',
});
```

### 2. Client Initialization (`src/hooks.client.ts` or `+layout.svelte`)

```ts
import { initSvelteKitHydration } from '@methane/ssr-sveltekit/client';

initSvelteKitHydration();
await import('@methane/ui/button');

// Or pass a Lit TemplateResult + root element to hydrateSvelteKitRoot(template, container)
```

## Notes

- `createMethaneHandle()` wraps SvelteKit's `transformPageChunk` so HTML responses stream with expanded `<template shadowrootmode="open">` markup and hoisted `<link rel="stylesheet">` tags.
- Compatible with `@methane/svelte` Svelte 5 runes components and direct `<mth-*>` tags.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
