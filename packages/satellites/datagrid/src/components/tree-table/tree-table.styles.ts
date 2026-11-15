import { css } from 'lit';

export const treeTableStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_tt-bg: var(--mth-color-surface, Canvas);
    --_tt-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_tt-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_tt-focus: var(--mth-color-border-focus, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
    --_tt-accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.25 0.06 250)));
    --_tt-muted: var(--mth-color-fg-muted, GrayText);
    --_tt-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_tt-bg);
    border: 1px solid var(--_tt-border);
    border-radius: var(--_tt-radius);
    overflow: hidden;
  }

  .viewport {
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
    min-block-size: var(--_tt-row-height, 2.375rem);
    border-block-end: 1px solid var(--_tt-border);
    background: var(--_tt-bg);
  }

  .row:focus-visible {
    outline: 2px solid var(--_tt-focus);
    outline-offset: -2px;
  }

  .row[data-selected='true'] {
    background: var(--_tt-accent-subtle);
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_tt-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .cell,
  .header-cell {
    box-sizing: border-box;
    flex: 1 0 7.5rem;
    min-inline-size: 5rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--_tt-border);
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .select-cell {
    flex: 0 0 2.75rem;
    min-inline-size: 2.75rem;
    justify-content: center;
  }

  .tree-toggle {
    appearance: none;
    border: 1px solid var(--_tt-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding-block: 0.125rem;
    padding-inline: 0.375rem;
  }

  .tree-toggle:focus-visible {
    outline: 2px solid var(--_tt-focus);
    outline-offset: 2px;
  }

  .status {
    padding: var(--mth-space-4, 1rem);
    color: var(--_tt-muted);
    text-align: center;
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .cell,
    .header-cell,
    .tree-toggle {
      border-color: ButtonBorder;
    }

    .row:focus-visible,
    .tree-toggle:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
