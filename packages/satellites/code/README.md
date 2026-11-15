# `@methane/code`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first developer code display, **CodeMirror 6** interactive editor, unified/split diff viewer, and dual tree/raw JSON editor Web Components for **Methane UI**.

## Installation

```bash
pnpm add @methane/code @methane/core @methane/tokens
# or
npm install @methane/code @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/code` | Auto-registers all 4 code elements and exports `registerAllComponents(prefix?)` |
| `@methane/code/<slug>` | Per-component entrypoint (`code-block`, `code-editor`, `diff-viewer`, `json-editor`) |
| `@methane/code/<slug>/element` | Unregistered classes, specs, styles, messages, and `registerMth*()` |
| `@methane/code/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-code-block>` | `MthCodeBlock` | `code`, `language`, `label`, `line-numbers`, `highlight-lines`, `show-copy` | `mth-copy` |
| `<mth-code-editor>` | `MthCodeEditor` | `name`, `label`, `value`, `language`, `tab-traps-focus`, `required`, `disabled`, `readonly` | `mth-input`, `mth-change` |
| `<mth-diff-viewer>` | `MthDiffViewer` | `original`, `modified`, `filename`, `label`, `view` (`unified` \| `split`) | `mth-view-change`, `mth-hunk-change` |
| `<mth-json-editor>` | `MthJsonEditor` | `name`, `label`, `value`, `mode` (`tree` \| `code` \| `split`), `required`, `disabled`, `readonly` | `mth-input`, `mth-change`, `mth-mode-change` |

## Usage Examples

```html
<mth-code-block
  language="typescript"
  line-numbers
  highlight-lines="2-3"
  show-copy
  code="import '@methane/ui/button';&#10;const ok = true;"
></mth-code-block>

<mth-code-editor
  name="snippet"
  label="Config Script"
  language="json"
  value='{"enabled": true}'
></mth-code-editor>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/code/diff-viewer';
import '@methane/code/json-editor';
```

## Theming, A11y & Lazy-Engine Notes

- **Theming**: Style code surfaces, gutters, line highlights, and headers via `::part(base)`, `::part(header)`, `::part(surface)`, `::part(copy-button)`, `::part(row)`, and `--mth-*` tokens.
- **Keyboard Escape Hatch**: `<mth-code-editor>` defaults `tab-traps-focus` to `false` (or exposes an accessible toggle button `::part(tab-toggle)`) so keyboard users never get trapped in the editor (WCAG 2.1.2).
- **Forms & SSR**: `<mth-code-editor>` and `<mth-json-editor>` participate in `<form>` validation via FACE `ElementInternals`. CodeMirror 6 mounts lazily on connect while syntax/fallback markup works cleanly during SSR.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
