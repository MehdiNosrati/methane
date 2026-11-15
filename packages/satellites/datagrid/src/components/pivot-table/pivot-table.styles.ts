import { css } from 'lit';

export const pivotTableStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_pt-bg: var(--mth-color-surface, Canvas);
    --_pt-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_pt-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_pt-focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_pt-accent: var(--mth-color-accent, oklch(0.55 0.2 250));
    --_pt-accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.25 0.06 250)));
    --_pt-muted: var(--mth-color-fg-muted, GrayText);
    --_pt-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_pt-bg);
    border: 1px solid var(--_pt-border);
    border-radius: var(--_pt-radius);
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
    min-block-size: 2.375rem;
    border-block-end: 1px solid var(--_pt-border);
    background: var(--_pt-bg);
  }

  .row:focus-visible {
    outline: 2px solid var(--_pt-focus);
    outline-offset: -2px;
  }

  .row[data-kind='totals'] {
    background: var(--_pt-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_pt-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .cell,
  .header-cell {
    box-sizing: border-box;
    flex: 1 0 7.5rem;
    min-inline-size: 6rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--_pt-border);
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .group-toggle {
    appearance: none;
    border: 1px solid var(--_pt-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding-block: 0.125rem;
    padding-inline: 0.375rem;
  }

  .group-toggle:focus-visible {
    outline: 2px solid var(--_pt-focus);
    outline-offset: 2px;
  }

  .status {
    padding: var(--mth-space-4, 1rem);
    color: var(--_pt-muted);
    text-align: center;
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .cell,
    .header-cell,
    .group-toggle {
      border-color: ButtonBorder;
    }

    .row:focus-visible,
    .group-toggle:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
