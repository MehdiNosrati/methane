import { css } from 'lit';

export const comparisonTableStyles = css`
  :host {
    display: block;
    --_table-bg: var(--mth-color-surface, Canvas);
    --_table-head-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_table-fg: var(--mth-color-fg, CanvasText);
    --_table-muted: var(--mth-color-fg-muted, GrayText);
    --_table-border: var(--mth-color-border, ButtonBorder);
    --_table-highlight-bg: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_table-accent: var(--mth-color-accent, Highlight);
    --_table-accent-fg: var(--mth-color-accent-fg, HighlightText);
    --_table-success: var(--mth-color-success, oklch(0.55 0.16 145));
    --_table-radius: var(--mth-radius-md, 0.5rem);
    --_cell-pad-block: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
    --_cell-pad-inline: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--_table-fg);
  }

  :host([compact]) {
    --_cell-pad-block: calc(var(--mth-space-2, 0.5rem) * var(--mth-density, 1));
    --_cell-pad-inline: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
  }

  .scroll-region {
    inline-size: 100%;
    overflow-inline: auto;
    border: 1px solid var(--_table-border);
    border-radius: var(--_table-radius);
    background: var(--_table-bg);
    box-sizing: border-box;
  }

  .scroll-region:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  table {
    inline-size: 100%;
    border-collapse: collapse;
    text-align: start;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  caption {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--_cell-pad-inline);
    text-align: start;
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--_table-fg);
    border-block-end: 1px solid var(--_table-border);
  }

  th,
  td {
    padding-block: var(--_cell-pad-block);
    padding-inline: var(--_cell-pad-inline);
    border-block-end: 1px solid var(--_table-border);
    vertical-align: middle;
  }

  th:not(:last-child),
  td:not(:last-child) {
    border-inline-end: 1px solid var(--_table-border);
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-block-end: none;
  }

  thead th {
    background: var(--_table-head-bg);
    font-weight: var(--mth-font-weight-semibold, 600);
    text-align: start;
  }

  :host([sticky-header]) thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
  }

  tbody th {
    font-weight: var(--mth-font-weight-medium, 500);
    text-align: start;
  }

  [data-highlighted='true'] {
    background: var(--_table-highlight-bg);
  }

  .plan-header-content {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    align-items: flex-start;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding-block: var(--mth-space-px, 0.0625rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_table-accent);
    color: var(--_table-accent-fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .price {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_table-muted);
    font-weight: var(--mth-font-weight-normal, 400);
  }

  .feature-desc {
    display: block;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_table-muted);
    font-weight: var(--mth-font-weight-normal, 400);
    margin-block-start: var(--mth-space-px, 0.0625rem);
  }

  .plan-action {
    margin-block-start: var(--mth-space-1, 0.25rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_table-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_table-bg);
    color: var(--_table-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .plan-action:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  .bool-yes {
    color: var(--_table-success);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .bool-no {
    color: var(--_table-muted);
  }

  .footer {
    margin-block-start: var(--mth-space-2, 0.5rem);
  }

  @media (forced-colors: active) {
    .scroll-region,
    th,
    td,
    .plan-action {
      border-color: CanvasText;
    }

    .badge {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
