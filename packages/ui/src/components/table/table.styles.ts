import { css } from 'lit';

export const tableStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_tbl-bg: var(--mth-color-surface, Canvas);
    --_tbl-fg: var(--mth-color-fg, CanvasText);
    --_tbl-muted: var(--mth-color-fg-muted, GrayText);
    --_tbl-header-bg: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
    --_tbl-selected-bg: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    --_tbl-border: var(--mth-color-border, ButtonBorder);
    --_tbl-focus-ring: var(--mth-color-border-focus, Highlight);
    --_tbl-accent: var(--mth-color-accent, Highlight);
    --_tbl-danger: var(--mth-color-danger, LinkText);
  }

  .base {
    overflow-inline: auto;
    border: 1px solid var(--_tbl-border);
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--_tbl-bg);
    color: var(--_tbl-fg);
    box-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
  }

  .slot-host {
    display: none;
  }

  table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: start;
  }

  caption {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    text-align: start;
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--_tbl-fg);
  }

  thead th {
    background-color: var(--_tbl-header-bg);
    color: var(--_tbl-fg);
    font-weight: var(--mth-font-weight-semibold, 600);
    border-block-end: 1px solid var(--_tbl-border);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    white-space: nowrap;
  }

  :host([sticky-header]) thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
  }

  tbody td {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--_tbl-border);
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-block-end: none;
  }

  :host([striped]) tbody tr:nth-child(even) {
    background-color: var(--mth-color-bg-subtle, oklch(0.98 0.003 255));
  }

  tbody tr[aria-selected='true'] {
    background-color: var(--_tbl-selected-bg);
  }

  [data-align='center'] {
    text-align: center;
  }

  [data-align='end'] {
    text-align: end;
  }

  .select-col {
    inline-size: 2.5rem;
    text-align: center;
  }

  .sort-button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    padding-block: 0.125rem;
    padding-inline: 0.25rem;
    margin-inline-start: -0.25rem;
    border-radius: var(--mth-radius-xs, 0.125rem);
    cursor: pointer;
  }

  .sort-button:focus-visible,
  .select-input:focus-visible {
    outline: 2px solid var(--_tbl-focus-ring);
    outline-offset: 1px;
  }

  .sort-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--_tbl-accent);
  }

  .status-cell {
    padding-block: var(--mth-space-6, 1.5rem);
    text-align: center;
    color: var(--_tbl-muted);
  }

  .status-cell[data-status='error'] {
    color: var(--_tbl-danger);
  }

  .retry {
    appearance: none;
    margin-inline-start: var(--mth-space-2, 0.5rem);
    background: transparent;
    color: var(--_tbl-accent);
    border: 1px solid var(--_tbl-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  @media (forced-colors: active) {
    tbody tr[aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
