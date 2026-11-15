# `@methane-ui/datagrid`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Enterprise virtualized data visualization and planning Web Components for **Methane UI** — wrapping `@tanstack/table-core` and `@tanstack/virtual-core` across datagrids, pivot tables, hierarchical tree tables, resource schedulers, and dependency Gantt charts.

## Installation

```bash
pnpm add @methane-ui/datagrid @methane-ui/core @methane-ui/tokens
# or
npm install @methane-ui/datagrid @methane-ui/core @methane-ui/tokens
```

> **Peer dependency:** `@methane-ui/core` (`^0.1.2`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane-ui/datagrid` | Tree-shakeable barrel re-exporting component classes, styles, messages, `registerMth*` helpers, and `registerAllComponents(prefix?)` without side effects |
| `@methane-ui/datagrid/define` | Side-effect entrypoint that auto-registers all datagrid custom elements and exports `registerAllComponents` |
| `@methane-ui/datagrid/<slug>` | Per-component entrypoint (`datagrid`, `pivot-table`, `tree-table`, `scheduler`, `gantt`) |
| `@methane-ui/datagrid/<slug>/element` | Unregistered classes, styles, messages, and `registerMth*()` |
| `@methane-ui/datagrid/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-datagrid>` | `MthDatagrid` | `selectable`, `multi-sort`, `filter`, `row-height`, `label`, `.columns`, `.data` | `mth-sort-change`, `mth-selection-change`, `mth-column-resize` |
| `<mth-pivot-table>` | `MthPivotTable` | `aggregator`, `show-totals`, `label`, `.data`, `.rows`, `.columns`, `.values` | `mth-pivot-change`, `mth-group-toggle` |
| `<mth-tree-table>` | `MthTreeTable` | `sub-rows-key`, `selectable`, `row-height`, `label`, `.columns`, `.data` | `mth-expand-change`, `mth-selection-change` |
| `<mth-scheduler>` | `MthScheduler` | `start-date`, `days`, `row-height`, `label`, `.resources`, `.events` | `mth-event-select`, `mth-date-navigate` |
| `<mth-gantt>` | `MthGantt` | `start-date`, `days`, `row-height`, `show-dependencies`, `label`, `.tasks` | `mth-task-select` |

## Usage Examples

```html
<mth-datagrid id="users-grid" selectable multi-sort row-height="40" label="Users"></mth-datagrid>
```

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/datagrid/datagrid';

const grid = document.getElementById('users-grid') as any;
grid.columns = [
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'role', header: 'Role', accessorKey: 'role' },
];
grid.data = [
  { id: '1', name: 'Ada Lovelace', role: 'Admin' },
  { id: '2', name: 'Alan Turing', role: 'Maintainer' },
];
```

## Theming, A11y & Performance Notes

- **Theming**: Style grid cells, pinned/sticky headers, bars, and viewports via `::part(base)`, `::part(viewport)`, `::part(grid)`, `::part(header)`, `::part(row)`, `::part(cell)`, and `--mth-*` tokens, plus `[data-mth-density="compact"]` density scaling.
- **Accessibility & Keyboard**: Implements `role="grid"` / `role="treegrid"` semantics, roving cell keyboard navigation, and `aria-sort` column states.
- **Virtualization & SSR**: `@tanstack/virtual-core` windows tens of thousands of rows smoothly in the browser while SSR outputs structural headers and initial visible rows.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
