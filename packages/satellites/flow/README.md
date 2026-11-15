# `@methane-ui/flow`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap-first interactive node/DAG flow diagram editor (`<mth-flow-editor>`) and hierarchical organization chart (`<mth-org-chart>`) powered by `@dagrejs/dagre` automatic graph layout for **Methane UI**.

## Installation

```bash
pnpm add @methane-ui/flow @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/flow @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/flow` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/flow/define` | Side-effect entrypoint that auto-registers all flow custom elements and exports `registerAllComponents` |
| `@methane-ui/flow/flow-editor` / `@methane-ui/flow/org-chart` | Per-component tree-shakeable entrypoints |
| `@methane-ui/flow/*/element` | Unregistered classes, styles, messages, and `registerMth*()` helpers |
| `@methane-ui/flow/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-flow-editor>` | `MthFlowEditor` | `direction` (`LR` \| `TB` \| `RL` \| `BT`), `edge-style` (`bezier` \| `orthogonal` \| `straight`), `zoom`, `pan-x`, `pan-y`, `selected-id`, `auto-layout`, `label`, `.nodes`, `.edges` | `mth-node-select`, `mth-viewport-change`, `mth-layout-complete` |
| `<mth-org-chart>` | `MthOrgChart` | `direction`, `query`, `selected-id`, `label`, `.nodes` | `mth-node-select`, `mth-node-toggle` |

## Usage Examples

```html
<mth-flow-editor id="pipeline" direction="LR" edge-style="bezier" auto-layout></mth-flow-editor>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/flow/flow-editor';

const flow = document.getElementById('pipeline') as any;
flow.nodes = [
  { id: 'ingest', label: 'Ingest' },
  { id: 'transform', label: 'Transform' },
  { id: 'publish', label: 'Publish' },
];
flow.edges = [
  { id: 'e1', source: 'ingest', target: 'transform' },
  { id: 'e2', source: 'transform', target: 'publish' },
];
```

## Theming, A11y & SSR Notes

- **Theming**: Expose `::part(base)`, `::part(toolbar)`, `::part(canvas)`, `::part(edges)`, `::part(node)`, `::part(search)`, and `::part(card)` styled with `--mth-*` tokens.
- **Accessibility**: Nodes and org cards support keyboard selection/navigation and search filtering (`query` on `<mth-org-chart>`) with collapse/expand toggling (`mth-node-toggle`).
- **SSR & Layout**: Dagre graph layout computes deterministically in pure TypeScript without requiring Canvas/WebGL APIs.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
