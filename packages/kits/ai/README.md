# `@methane/ai`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

AI assistant and LLM UX Web Components for **Methane UI** — streaming Markdown messages with `@methane/sanitize` XSS protection, prompt composer with stop control, reasoning/tool-call disclosures, citations, side-by-side artifact viewer, and feedback capture.

## Installation

```bash
pnpm add @methane/ai @methane/core @methane/tokens
# or
npm install @methane/ai @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0 || ^1.0.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/ai` | Auto-registers all 8 AI kit elements and exports `registerAllComponents(prefix?)` |
| `@methane/ai/<slug>` | Per-component tree-shakeable auto-registering import (e.g. `@methane/ai/prompt-input`) |
| `@methane/ai/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` helper |
| `@methane/ai/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-prompt-input>` | `MthPromptInput` | `value`, `name`, `label`, `placeholder`, `streaming`, `submit-on-enter`, `max-rows`, `required`, `disabled` | `mth-input`, `mth-change`, `mth-submit`, `mth-stop` |
| `<mth-ai-message>` | `MthAiMessage` | `role`, `content`, `streaming`, `allow-raw-html`, `author`, `timestamp`, `show-actions` | `mth-copy`, `mth-regenerate` |
| `<mth-thinking-indicator>` | `MthThinkingIndicator` | `open`, `streaming`, `elapsed-seconds`, `summary`, `content` | `mth-toggle`, `mth-open`, `mth-after-open`, `mth-close`, `mth-after-close` |
| `<mth-tool-call>` | `MthToolCall` | `name`, `status`, `open`, `duration-ms` | `mth-toggle` |
| `<mth-citation-list>` | `MthCitationList` | `label`, `orientation`, `selected-id`, `.items` | `mth-select` |
| `<mth-suggestion-chips>` | `MthSuggestionChips` | `label`, `orientation`, `disabled`, `.suggestions` | `mth-select` |
| `<mth-artifact-pane>` | `MthArtifactPane` | `open`, `title`, `kind`, `language`, `content`, `active-version`, `active-tab`, `allow-raw-html` | `mth-copy`, `mth-close`, `mth-version-change`, `mth-tab-change` |
| `<mth-ai-feedback>` | `MthAiFeedback` | `rating`, `comment`, `submitted`, `disabled`, `label` | `mth-feedback` |

## Usage Examples

### HTML + Streaming Assistant Response

```html
<mth-ai-message
  id="assistant-msg"
  role="assistant"
  author="Assistant"
  streaming
></mth-ai-message>

<mth-thinking-indicator summary="Analyzed 3 files" elapsed-seconds="2" content="Checked AST nodes..."></mth-thinking-indicator>
<mth-tool-call name="search_docs" status="complete" duration-ms="142"></mth-tool-call>

<mth-prompt-input
  id="composer"
  placeholder="Ask a follow-up question..."
  submit-on-enter
></mth-prompt-input>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/ai';

const msg = document.querySelector('mth-ai-message')!;
msg.content = 'Here is the refactored snippet:\n\n```ts\nexport const ok = true;\n```';
msg.streaming = false;

document.getElementById('composer')?.addEventListener('mth-submit', (ev) => {
  const { value } = (ev as CustomEvent<{ value: string }>).detail;
  console.log('Submitted prompt:', value);
});
```

## Theming, A11y & Security Notes

- **Theming**: Expose `::part(base)`, `::part(content)`, `::part(composer)`, `::part(textarea)`, `::part(submit-button)`, `::part(stop-button)`, `::part(cursor)`, etc., styled with `--mth-color-surface`, `--mth-color-accent-subtle`, `--mth-color-border-focus`, and `--mth-radius-lg`.
- **XSS Hardening**: `<mth-ai-message>` and `<mth-artifact-pane>` sanitize streaming Markdown with `@methane/sanitize` (`allow-raw-html` defaults to `false`).
- **Accessibility & Keyboard**: `<mth-suggestion-chips>` and `<mth-citation-list>` use roving tabindex arrow navigation; `<mth-prompt-input>` participates in native FACE form submission and supports `Enter` / `Shift+Enter`.
- **SSR**: Renders initial message shells and controls cleanly with `@methane/ssr` Declarative Shadow DOM.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
