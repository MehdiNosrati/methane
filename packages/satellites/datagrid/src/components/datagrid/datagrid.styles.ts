import { css } from 'lit';

export const datagridStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_dg-bg: var(--mth-color-surface, Canvas);
    --_dg-header-bg: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_dg-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_dg-focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_dg-accent: var(--mth-color-accent, oklch(0.55 0.2 250));
    --_dg-accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.25 0.06 250)));
    --_dg-muted: var(--mth-color-fg-muted, GrayText);
    --_dg-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_dg-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_dg-bg);
    border: 1px solid var(--_dg-border);
    border-radius: var(--_dg-radius);
    overflow: hidden;
  }

  .viewport {
    position: relative;
    overflow: auto;
    max-block-size: 24rem;
    inline-size: 100%;
  }

  .grid {
    display: grid;
    inline-size: 100%;
  }

  .row {
    display: flex;
    align-items: center;
    min-block-size: var(--_dg-row-height, 2.5rem);
    border-block-end: 1px solid var(--_dg-border);
    background: var(--_dg-bg);
  }

  .row:focus-visible {
    outline: 2px solid var(--_dg-focus);
    outline-offset: -2px;
  }

  .row[data-selected='true'] {
    background: var(--_dg-accent-subtle);
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_dg-header-bg);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .cell,
  .header-cell {
    box-sizing: border-box;
    flex: 1 0 7.5rem;
    min-inline-size: 5rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--_dg-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-1, 0.25rem);
  }

  .select-cell {
    flex: 0 0 2.75rem;
    min-inline-size: 2.75rem;
    justify-content: center;
  }

  .header-cell[data-pinned='left'],
  .cell[data-pinned='left'] {
    position: sticky;
    inset-inline-start: 0;
    z-index: 2;
    background: var(--_dg-bg);
  }

  .header-cell[data-pinned='left'] {
    background: var(--_dg-header-bg);
  }

  .header-cell[data-pinned='right'],
  .cell[data-pinned='right'] {
    position: sticky;
    inset-inline-end: 0;
    z-index: 2;
    background: var(--_dg-bg);
  }

  .header-cell[data-pinned='right'] {
    background: var(--_dg-header-bg);
  }

  .sort-btn,
  .resize-btn,
  .retry-btn {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-1, 0.25rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
  }

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    font-weight: inherit;
  }

  .sort-btn:focus-visible,
  .resize-btn:focus-visible,
  .retry-btn:focus-visible {
    outline: 2px solid var(--_dg-focus);
    outline-offset: 1px;
  }

  .sort-indicator {
    color: var(--_dg-accent);
  }

  .resize-btn {
    color: var(--_dg-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .status {
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    color: var(--_dg-muted);
    text-align: center;
  }

  .status[data-state='error'] {
    color: var(--_dg-danger);
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .cell,
    .header-cell {
      border-color: ButtonBorder;
    }

    .row[data-selected='true'] {
      background: Highlight;
      color: HighlightText;
    }

    .sort-btn:focus-visible,
    .row:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
