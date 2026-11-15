# `@methane/pdf`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first Mozilla `pdfjs-dist` accessible document viewer (`<mth-pdf-viewer>`) for **Methane UI** — featuring lazy PDF.js initialization, outline drawer, in-document search, zoom/rotation controls, keyboard shortcuts, and URL sanitization.

## Installation

```bash
pnpm add @methane/pdf @methane/core @methane/tokens
# or
npm install @methane/pdf @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/pdf` | Auto-registers `<mth-pdf-viewer>` and exports `MthPdfViewer` & `registerAllComponents(prefix?)` |
| `@methane/pdf/pdf-viewer` | Per-component auto-registering entrypoint |
| `@methane/pdf/pdf-viewer/element` | Unregistered `MthPdfViewer`, spec, styles, messages, and `registerMthPdfViewer(prefix?)` |
| `@methane/pdf/custom-elements.json` | Custom Elements Manifest (CEM) |

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
import '@methane/tokens/tokens.css';
import '@methane/pdf/pdf-viewer';

const viewer = document.getElementById('viewer')!;
viewer.addEventListener('mth-page-change', (ev) => {
  console.log('Page:', (ev as CustomEvent<{ page: number; totalPages: number }>).detail);
});
```

## Theming, A11y & Lazy-Engine Notes

- **Theming**: Customize toolbar, canvas stage, and outline via `::part(base)`, `::part(toolbar)`, `::part(viewport)`, `::part(canvas)`, `::part(outline)`, and `--mth-*` tokens.
- **Accessibility & Keyboard**: Toolbar controls use `RovingFocusController` (`ArrowLeft`/`ArrowRight`), page jump inputs validate numeric bounds, and `PageUp`/`PageDown` or `+`/`-` control paging and zoom.
- **Security & SSR**: Unsafe `javascript:` / `data:` `src` values trigger `mth-pdf-error` without network requests. `pdfjs-dist` initializes only on the client inside connected environments, rendering a safe shell during SSR.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
