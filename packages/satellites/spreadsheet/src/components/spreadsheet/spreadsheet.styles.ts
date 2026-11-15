import { css } from 'lit';

export const spreadsheetStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_ss-bg: var(--mth-color-surface, Canvas);
    --_ss-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_ss-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_ss-focus: var(--mth-color-border-focus, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
    --_ss-accent: var(--mth-color-accent, light-dark(oklch(0.55 0.2 250), oklch(0.68 0.18 250)));
    --_ss-accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.25 0.06 250)));
    --_ss-danger: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.68 0.2 25)));
    --_ss-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_ss-bg);
    border: 1px solid var(--_ss-border);
    border-radius: var(--_ss-radius);
    overflow: hidden;
  }

  .viewport {
    overflow: auto;
    max-block-size: 26rem;
    inline-size: 100%;
  }

  .grid {
    display: grid;
    inline-size: max-content;
    min-inline-size: 100%;
  }

  .row {
    display: flex;
    align-items: stretch;
    min-block-size: var(--_ss-row-height, 2rem);
    border-block-end: 1px solid var(--_ss-border);
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_ss-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .corner-header,
  .row-header {
    box-sizing: border-box;
    flex: 0 0 3.25rem;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-inline-end: 1px solid var(--_ss-border);
    background: var(--_ss-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .col-header {
    box-sizing: border-box;
    flex: 0 0 6.5rem;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-inline-end: 1px solid var(--_ss-border);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell {
    box-sizing: border-box;
    flex: 0 0 6.5rem;
    border-inline-end: 1px solid var(--_ss-border);
    display: flex;
    align-items: center;
    padding: 0;
    position: relative;
  }

  .cell-btn {
    inline-size: 100%;
    block-size: 100%;
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    cursor: cell;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell-btn[data-active='true'] {
    background: var(--_ss-accent-subtle);
    outline: 2px solid var(--_ss-accent);
    outline-offset: -2px;
  }

  .cell-btn[data-error='true'] {
    color: var(--_ss-danger);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .cell-btn:focus-visible {
    outline: 2px solid var(--_ss-focus);
    outline-offset: -2px;
  }

  .cell-editor {
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    border: 2px solid var(--_ss-focus);
    background: var(--_ss-bg);
    color: inherit;
    font: inherit;
    padding-inline: var(--mth-space-2, 0.5rem);
  }

  .fallback-slot {
    display: none;
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .corner-header,
    .row-header,
    .col-header,
    .cell {
      border-color: ButtonBorder;
    }

    .cell-btn[data-active='true'],
    .cell-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
