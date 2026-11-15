# `@methane-ui/editor`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first rich text (**ProseMirror**), Markdown preview/editor, and LaTeX mathematical typesetting (**KaTeX**) Web Components for **Methane UI** — featuring `@methane-ui/sanitize` XSS protection and native Form-Associated Custom Element (FACE) integration.

## Installation

```bash
pnpm add @methane-ui/editor @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/editor @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/editor` | Auto-registers all 4 editor/document elements and exports `registerAllComponents(prefix?)` |
| `@methane-ui/editor/<slug>` | Per-component entrypoint (`markdown`, `markdown-editor`, `math-editor`, `rich-editor`) |
| `@methane-ui/editor/<slug>/element` | Unregistered classes, specs, styles, messages, and `registerMth*()` |
| `@methane-ui/editor/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-markdown>` | `MthMarkdown` | `content`, `label`, `allow-raw-html` | `mth-render` |
| `<mth-markdown-editor>` | `MthMarkdownEditor` | `name`, `label`, `value`, `placeholder`, `mode` (`write` \| `preview` \| `split`), `allow-raw-html`, `required`, `disabled`, `readonly` | `mth-input`, `mth-change`, `mth-mode-change` |
| `<mth-rich-editor>` | `MthRichEditor` | `name`, `label`, `value`, `placeholder`, `required`, `disabled`, `readonly` | `mth-input`, `mth-change` |
| `<mth-math-editor>` | `MthMathEditor` | `name`, `label`, `value`, `placeholder`, `display-mode`, `required`, `disabled`, `readonly` | `mth-input`, `mth-change`, `mth-error` |

## Usage Examples

```html
<mth-form>
  <mth-markdown-editor
    name="releaseNotes"
    label="Release Notes"
    mode="split"
    required
  ></mth-markdown-editor>

  <mth-math-editor
    name="formula"
    label="Equation"
    value="\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"
    display-mode
  ></mth-math-editor>
</mth-form>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/editor/rich-editor';
import '@methane-ui/editor/markdown';
```

## Theming, A11y, Security & SSR Notes

- **Security**: `<mth-markdown>` and `<mth-markdown-editor>` pass HTML output through `@methane-ui/sanitize` (`allow-raw-html` defaults to `false`).
- **Accessibility & Forms**: Editor toolbars implement roving keyboard focus (`ArrowLeft`/`ArrowRight`), and `<mth-rich-editor>`, `<mth-markdown-editor>`, and `<mth-math-editor>` submit values cleanly through native `<form>` via `ElementInternals`.
- **SSR & Lazy Engine**: ProseMirror `EditorView` mounts lazily on client connect while `<mth-markdown>` and KaTeX preview render synchronously.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
