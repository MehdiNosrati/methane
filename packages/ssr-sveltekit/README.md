# `@methane-ui/ssr-sveltekit`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

SvelteKit server `handle` hook for Declarative Shadow DOM (DSD) expansion and client hydration adapter for **Methane UI** — built on `@methane-ui/ssr`.

## Installation

```bash
pnpm add @methane-ui/ssr-sveltekit @methane-ui/ssr @methane-ui/svelte @methane-ui/core
# or
npm install @methane-ui/ssr-sveltekit @methane-ui/ssr @methane-ui/svelte @methane-ui/core
```

## Package Exports

| Entrypoint | Environment | Exports |
| --- | --- | --- |
| `@methane-ui/ssr-sveltekit` | SvelteKit Server (`hooks.server.ts`) | `createMethaneHandle`, `transformSvelteKitHtml` |
| `@methane-ui/ssr-sveltekit/client` | Client (`hooks.client.ts` / layout) | `initSvelteKitHydration`, `hydrateSvelteKitRoot`, `isSvelteKitHydrationReady` |

## Usage Examples

### 1. Server Hook (`src/hooks.server.ts`)

```ts
import '@methane-ui/ssr/dom-shim';
import '@methane-ui/ui/button';
import { createMethaneHandle } from '@methane-ui/ssr-sveltekit';

export const handle = createMethaneHandle({
  styles: 'linked',
  assetBase: '/_methane/styles',
});
```

### 2. Client Initialization (`src/hooks.client.ts` or `+layout.svelte`)

```ts
import { initSvelteKitHydration } from '@methane-ui/ssr-sveltekit/client';

initSvelteKitHydration();
await import('@methane-ui/ui/button');

// Or pass a Lit TemplateResult + root element to hydrateSvelteKitRoot(template, container)
```

## Notes

- `createMethaneHandle()` wraps SvelteKit's `transformPageChunk` so HTML responses stream with expanded `<template shadowrootmode="open">` markup and hoisted `<link rel="stylesheet">` tags.
- Compatible with `@methane-ui/svelte` Svelte 5 runes components and direct `<mth-*>` tags.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
