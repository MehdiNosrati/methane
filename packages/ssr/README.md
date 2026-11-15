# `@methane/ssr`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Streaming Declarative Shadow DOM (DSD) server-side rendering engine for **Methane UI** — wrapping `@lit-labs/ssr` with hybrid linked + `< 1 KB` critical inline style delivery, `<head>` stylesheet link hoisting, and framework-agnostic hydration utilities.

## Installation

```bash
pnpm add @methane/ssr @methane/core
# or
npm install @methane/ssr @methane/core
```

## Package Exports

| Entrypoint | Purpose |
| --- | --- |
| `@methane/ssr` | Server rendering APIs (`renderToString`, `renderWithMetadata`, `renderToStream`, `transformHtmlDsd`, `createSsrTransformStream`, `hoistStylesheetLinks`, `MethaneElementRenderer`, style hashing/critical extraction) |
| `@methane/ssr/client` | Client hydration utilities (`enableHydrationSupport`, `hydrateRoot`, `isHydrationSupported`, `digestForTemplateResult`, `LIT_HYDRATE_SUPPORT_IMPORT`) |
| `@methane/ssr/dom-shim` | Server DOM shim installer (`installSsrDomShim`) |

## Key Exported Symbols

| Symbol | Description |
| --- | --- |
| `renderToString(template, options?)` | Renders a Lit `TemplateResult` to an HTML string with Declarative Shadow DOM |
| `renderWithMetadata(template, options?)` | Returns `{ html, links }` containing deduplicated `StylesheetLink` metadata |
| `renderToStream(template, options?)` / `renderToStringStream(template, options?)` | Web `ReadableStream<string>` / async iterable streaming DSD renderer |
| `transformHtmlDsd(html, options?)` | Expands un-upgraded `<mth-*>` HTML tags in-place with DSD shadow roots and hoisted stylesheet links |
| `createSsrTransformStream(options?)` | `TransformStream` for hoisting `<link rel="stylesheet">` tags in streaming HTML responses |
| `hoistStylesheetLinks(html, options?)` | Extracts and deduplicates shadow stylesheet links into `<head>` |
| `enableHydrationSupport()` / `hydrateRoot(container)` | Enables `@lit-labs/ssr-client` hydration and hydrates DSD fragments inside a root element |
| `installSsrDomShim()` | Installs `@lit-labs/ssr-dom-shim` globals before importing custom element modules in Node/Edge |

## Usage Examples

### Server Rendering with Hybrid Linked Styles (`ADR-008`)

```ts
import '@methane/ssr/dom-shim';
import '@methane/ui/button';
import { html } from 'lit';
import { renderWithMetadata } from '@methane/ssr';

const { html: markup, links } = await renderWithMetadata(
  html`<mth-button variant="primary">Save</mth-button>`,
  {
    styles: 'linked',
    assetBase: '/_methane/styles',
  },
);
```

### Expanding Framework HTML Output (`transformHtmlDsd`)

```ts
import { installSsrDomShim } from '@methane/ssr/dom-shim';
installSsrDomShim();

await import('@methane/ui/alert');
const { transformHtmlDsd } = await import('@methane/ssr');

const result = await transformHtmlDsd(
  '<html><head></head><body><mth-alert variant="info">Ready</mth-alert></body></html>',
  { styles: 'inline' },
);
```

### Client Hydration Entry

```ts
// Import BEFORE registering custom elements
import { enableHydrationSupport, hydrateRoot } from '@methane/ssr/client';

enableHydrationSupport();
await import('@methane/ui/alert');
hydrateRoot(document.body);
```

## Architecture & SSR Modes

- **`styles: 'linked'` (default)**: Emits a capped `< 1 KB` (`CRITICAL_SHELL_MAX_BYTES = 1024`) critical host shell `<style>` plus a content-hashed `<link rel="stylesheet" href="${assetBase}/${tag}.${hash}.css">` hoisted into `<head>`.
- **`styles: 'inline'`**: Embeds full component CSS inside `<template shadowrootmode="open">` for single-file HTML exports, email templates, and serverless edge routes without static asset serving.
- **Note**: `@methane/core` also bundles `@lit-labs/ssr-client` hydration support automatically when loaded in the browser; `@methane/ssr/client` gives explicit control for framework adapters and `hydrateRoot()`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
