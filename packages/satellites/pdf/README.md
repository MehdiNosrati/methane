# `@methane-ui/pdf`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first Mozilla `pdfjs-dist` accessible document viewer (`<mth-pdf-viewer>`) for **Methane UI** — featuring lazy PDF.js initialization, outline drawer, in-document search, zoom/rotation controls, keyboard shortcuts, and URL sanitization.

## Installation

```bash
pnpm add @methane-ui/pdf @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/pdf @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/pdf` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/pdf/define` | Side-effect entrypoint that auto-registers all pdf custom elements and exports `registerAllComponents` |
| `@methane-ui/pdf/pdf-viewer` | Per-component auto-registering entrypoint |
| `@methane-ui/pdf/pdf-viewer/element` | Unregistered `MthPdfViewer`, styles, messages, and `registerMthPdfViewer(prefix?)` |
| `@methane-ui/pdf/custom-elements.json` | Custom Elements Manifest (CEM) |

## Component API (`<mth-pdf-viewer>`)

| Prop / Attribute | Type | Description |
| --- | --- | --- |
| `src` | `string` | HTTPS/HTTP/relative URL to the PDF document (rejects `javascript:` and `data:` protocols) |
| `worker-src` | `string` | Custom `pdf.js` Web Worker script URL |
| `document-title` | `string` | Accessible title and download filename hint |
| `page` | `number` | Current 1-based page number (clamped to `1..totalPages`) |
| `total-pages` | `number` | Loaded page count (read-only/reflected) |
| `zoom` | `number` | Scale multiplier (e.g. `1`, `1.25`, `1.5`, `'page-width'`) |
| `rotation` | `number` | Page rotation in degrees (`0`, `90`, `180`, `270`) |
| `search-query` | `string` | Active text search query across loaded pages |
| `show-outline` | `boolean` | Toggles the document outline sidebar |
| `show-toolbar` | `boolean` | Shows/hides the built-in viewer toolbar |

**Events:** `mth-pdf-load`, `mth-page-change`, `mth-zoom-change`, `mth-search-change`, `mth-pdf-error`.

## Usage Examples

```html
<mth-pdf-viewer
  id="viewer"
  src="/docs/architecture-spec.pdf"
  worker-src="/assets/pdf.worker.min.mjs"
  document-title="Architecture Specification"
  zoom="1.25"
  show-toolbar
></mth-pdf-viewer>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/pdf/pdf-viewer';

const viewer = document.getElementById('viewer')!;
viewer.addEventListener('mth-page-change', (ev) => {
  console.log('Page:', (ev as CustomEvent<{ page: number; totalPages: number }>).detail);
});
```

## Production Worker Configuration (`worker-src` / `workerSrc`)

When `worker-src` (or the `workerSrc` property) is **not** set, `<mth-pdf-viewer>` imports `pdfjs-dist/build/pdf.worker.mjs` on the main thread so offline viewing works out of the box with zero configuration. That fallback has two important production costs:

1. **Main-thread blocking:** Large PDFs are parsed on the main thread, so the page can freeze briefly during decoding and text/outline extraction.
2. **Lazy-chunk size:** The `pdf.js` worker module is large (several hundred KB) and gets pulled directly into your application's lazy chunks.

**Recommendation:** Always set `worker-src` / `workerSrc` in production builds to serve the `pdf.js` worker as a dedicated static/worker asset instead of bundling it into app chunks:

```html
<!-- Static asset / CDN / copied public file -->
<mth-pdf-viewer
  src="/docs/architecture-spec.pdf"
  worker-src="/assets/pdf.worker.min.mjs"
></mth-pdf-viewer>
```

```ts
// Vite / Rollup ?url asset import (emits pdf.worker.mjs separately from app chunks)
import '@methane-ui/pdf/pdf-viewer';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const viewer = document.querySelector('mth-pdf-viewer')!;
viewer.workerSrc = pdfWorkerUrl;
```

## Theming, A11y & Lazy-Engine Notes

- **Theming**: Customize toolbar, canvas stage, and outline via `::part(base)`, `::part(toolbar)`, `::part(viewport)`, `::part(canvas)`, `::part(outline)`, and `--mth-*` tokens.
- **Accessibility & Keyboard**: Toolbar controls use `RovingFocusController` (`ArrowLeft`/`ArrowRight`), page jump inputs validate numeric bounds, and `PageUp`/`PageDown` or `+`/`-` control paging and zoom.
- **Security & SSR**: Unsafe `javascript:` / `data:` `src` values trigger `mth-pdf-error` without network requests. `pdfjs-dist` initializes only on the client inside connected environments, rendering a safe shell during SSR.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
