---
name: methane-ssr
description: Configures Declarative Shadow DOM server rendering, FOUC prevention, lazy client engine boundaries, and hydration across Next.js, Nuxt, SvelteKit, Astro, Angular, and HTML using @methane/ssr* and @methane/core/hydrate. Use when setting up SSR or fixing hydration issues.
---

# Methane Server Rendering (DSD) & Hydration

Methane renders custom elements on the server as Declarative Shadow DOM (`<template shadowrootmode="open">`) via `@methane/ssr` and framework adapters, then hydrates in place without layout shift.

## Hydration Import Order (Critical)

On the client, load hydration support **before** registering any Lit / Methane custom element:

```ts
// Standalone / Lit apps
import '@methane/core/hydrate';
import '@methane/ui/button';
```

Framework adapters re-export dedicated `/client` initializers (`initNextHydration()`, `initNuxtHydration()`, `initSvelteKitHydration()`, `initAstroHydration()`, `provideMethaneHydration()`).

## Style Delivery Modes

All `@methane/ssr*` adapters share two `styles` options:

- `styles: 'linked'` (default): Emits a cacheable `<link rel="stylesheet">` plus a `< 1 KB` critical inline `<style>` shell inside the shadow root, and hoists deduplicated `<link rel="preload" as="style">` tags into `<head>`. Pass `assetBase` (e.g. `'/assets/methane'`) matching where stylesheet assets are served.
- `styles: 'inline'`: Embeds the full component stylesheet inside `<style>` — ideal for single-file HTML, emails, or setups where framework bundlers already serve CSS.

## Framework Setups

### Next.js App Router (`@methane/ssr-next`)

1. Wrap `next.config.*` with `withMethaneNextConfig(nextConfig)`.
2. In a `"use client"` bootstrap module, call `initNextHydration()` before importing `@methane/ui/*`:

```ts
'use client';
import { initNextHydration } from '@methane/ssr-next/client';
initNextHydration();
```

3. Use `renderNextHtml()` / `transformNextResponse()` / `createNextSsrTransformStream()` when streaming DSD HTML from Route Handlers or middleware.

### Nuxt 3 / Nitro (`@methane/ssr-nuxt`)

1. Merge `createMethaneNuxtConfig()` (sets `vue.compilerOptions.isCustomElement` for `mth-*` and Nitro externals) in `nuxt.config.ts`.
2. Register `createMethaneNitroPlugin({ styles: 'linked', assetBase: '/assets/methane' })` in `server/plugins/methane.ts`.
3. Call `initNuxtHydration()` in a client plugin before loading custom elements.

### SvelteKit (`@methane/ssr-sveltekit`)

1. Export `handle = createMethaneHandle({ styles: 'inline' })` (or `'linked'` with `assetBase`) from `src/hooks.server.ts`.
2. Call `initSvelteKitHydration()` in `src/hooks.client.ts`.

### Astro (`@methane/ssr-astro`)

Add `createMethaneAstroIntegration({ styles: 'linked' })` in `astro.config.mjs` (automatically registers the renderer and injects `@methane/ssr-astro/client`). Use `createMethaneAstroMiddleware()` for SSR HTML responses.

### Angular SSR (`@methane/ssr-angular`)

1. Post-process SSR output with `serializeAngularSsrHtml(html, { styles: 'inline' })` or `createAngularSsrTransformStream()` — preserves `ng-version`, `ngh`, and `ng-server-context`.
2. In `app.config.ts`, register `provideAppInitializer(() => provideMethaneHydration().initialize())` and call `upgradeMethaneAngularElements()` if custom elements load lazily.

## Prevent FOUC & Guard Heavy Satellites

- **FOUC protection**: Load `@methane/css/defined-guard.css` (included in `@methane/css/index.css` and `base.css`). It fades in `:not(:defined)` interactive elements with a fail-open 2s fallback animation while keeping pure-CSS tags (`mth-stack`, `mth-grid`, `mth-flex`, `mth-container`, `mth-spacer`) immediately visible at `opacity: 1`.
- **Lazy client engines**: Heavy satellites (`@methane/charts`, `@methane/datagrid`, `@methane/editor`, `@methane/code`, `@methane/maps`, `@methane/pdf`, `@methane/3d`) defer importing third-party engines (`echarts`, `maplibre-gl`, `pdfjs-dist`, `three`) until connected in a browser DOM (`typeof document !== 'undefined'`), keeping server bundles lightweight and SSR-safe.
