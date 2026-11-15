# `@methane/admin`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Enterprise SaaS dashboard, backoffice, scheduling, and data-operations Web Components for **Methane UI** — Kanban boards, query/filter builders, CSV importers, audit logs, virtualized file explorers, event calendars, and settings shells.

## Installation

```bash
pnpm add @methane/admin @methane/core @methane/tokens
# or
npm install @methane/admin @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0 || ^1.0.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/admin` | Auto-registers all 13 admin kit elements and exports `registerAllComponents(prefix?)` |
| `@methane/admin/<slug>` | Per-component entrypoint (e.g. `@methane/admin/kanban`, `@methane/admin/filter-builder`) |
| `@methane/admin/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` |
| `@methane/admin/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-audit-log>` | `MthAuditLog` | `severity`, `search`, `row-height`, `.entries` | `mth-entry-select`, `mth-filter-change` |
| `<mth-availability-picker>` | `MthAvailabilityPicker` | `name`, `value`, `disabled`, `readonly`, `required`, `error` | `mth-change` |
| `<mth-booking-widget>` | `MthBookingWidget` | `name`, `value`, `disabled`, `readonly`, `required`, `error` | `mth-change`, `mth-confirm` |
| `<mth-bulk-action-bar>` | `MthBulkActionBar` | `selected-count`, `total-count`, `show-when-empty` | `mth-select-all`, `mth-clear-selection`, `mth-action` |
| `<mth-column-chooser>` | `MthColumnChooser` | `allow-reorder`, `allow-reset`, `.columns` | `mth-change`, `mth-reset` |
| `<mth-csv-importer>` | `MthCsvImporter` | `raw-csv`, `has-header`, `.fields` | `mth-parse`, `mth-import` |
| `<mth-event-calendar>` | `MthEventCalendar` | `view`, `active-date`, `.events` | `mth-event-select`, `mth-event-create`, `mth-date-change` |
| `<mth-file-explorer>` | `MthFileExplorer` | `current-folder-id`, `view-mode`, `columns`, `.items` | `mth-navigate`, `mth-file-open`, `mth-selection-change` |
| `<mth-filter-builder>` | `MthFilterBuilder` | `combinator`, `disabled`, `.fields`, `.rules` | `mth-change` |
| `<mth-kanban>` | `MthKanban` | `filter`, `.lanes`, `.cards` | `mth-card-move`, `mth-card-select` |
| `<mth-query-builder>` | `MthQueryBuilder` | `name`, `value`, `show-preview`, `disabled`, `required`, `readonly`, `error` | `mth-change` |
| `<mth-saved-views>` | `MthSavedViews` | `active-view-id`, `allow-create`, `allow-manage`, `.views` | `mth-view-select`, `mth-view-create`, `mth-view-duplicate`, `mth-view-pin`, `mth-view-delete` |
| `<mth-settings-shell>` | `MthSettingsShell` | `active-section-id`, `dirty`, `saving`, `.sections` | `mth-section-change`, `mth-save`, `mth-discard` |

## Usage Examples

```html
<mth-bulk-action-bar selected-count="3" total-count="42">
  <mth-button size="sm" variant="danger">Archive</mth-button>
</mth-bulk-action-bar>

<mth-kanban id="board"></mth-kanban>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/admin/kanban';
import '@methane/admin/bulk-action-bar';

const board = document.getElementById('board') as any;
board.lanes = [
  { id: 'todo', title: 'To Do', wipLimit: 5 },
  { id: 'done', title: 'Done' },
];
board.cards = [
  { id: 'c1', laneId: 'todo', title: 'Audit tokens' },
];
```

## Theming, A11y & SSR Notes

- **Theming**: Integrates `--mth-*` semantic tokens and exposes granular parts (`::part(lane)`, `::part(card)`, `::part(nav)`, `::part(save-bar)`, etc.) plus `[data-mth-density="compact"]` density scaling.
- **Accessibility**: Full keyboard reordering in `<mth-kanban>` and `<mth-column-chooser>`, FACE participation for form widgets (`availability-picker`, `booking-widget`, `query-builder`), and roving focus across calendar/explorer grids.
- **SSR**: Server-renders cleanly with `@methane/ssr`; interactive drag/virtualization hooks attach on client connect.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
