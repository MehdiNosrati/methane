import { css } from 'lit';

export const dateRangeCalendarStyles = css`
  :host {
    display: inline-block;
    --_drc-bg: var(--mth-color-surface, oklch(1 0 0));
    --_drc-subtle: var(--mth-color-bg-subtle, oklch(0.96 0.005 250));
    --_drc-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_drc-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_drc-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_drc-focus: var(--mth-color-border-focus, oklch(0.55 0.2 250));
    --_drc-accent: var(--mth-color-accent, oklch(0.54 0.2 255));
    --_drc-accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_drc-accent-subtle: var(--mth-color-accent-subtle, oklch(0.94 0.04 255));
    --_drc-radius: var(--mth-radius-lg, 0.75rem);
    --_drc-cell-size: var(--mth-space-8, 2.25rem);
    color: var(--_drc-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_drc-border);
    border-radius: var(--_drc-radius);
    background-color: var(--_drc-bg);
    box-shadow: var(--mth-shadow-xs, none);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .nav-group {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--mth-space-8, 2rem);
    block-size: var(--mth-space-8, 2rem);
    padding: 0;
    border: 1px solid var(--_drc-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_drc-bg);
    color: var(--_drc-fg);
    font: inherit;
    cursor: pointer;
  }

  .nav-btn:hover:not(:disabled) {
    background-color: var(--_drc-subtle);
  }

  .nav-btn:focus-visible {
    outline: 2px solid var(--_drc-focus);
    outline-offset: 2px;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .months {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-4, 1rem);
  }

  .month {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    text-align: center;
  }

  .grid {
    border-collapse: collapse;
    table-layout: fixed;
  }

  .weekday {
    padding-block: var(--mth-space-1, 0.25rem);
    color: var(--_drc-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    text-align: center;
  }

  .cell {
    padding-block: var(--mth-space-px, 1px);
    padding-inline: 0;
    text-align: center;
  }

  .day {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_drc-cell-size);
    block-size: var(--_drc-cell-size);
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_drc-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .day:hover:not([aria-disabled='true']) {
    background-color: var(--_drc-subtle);
  }

  .day:focus-visible {
    outline: 2px solid var(--_drc-focus);
    outline-offset: 2px;
  }

  .day[data-outside='true'] {
    color: var(--_drc-muted);
    opacity: 0.6;
  }

  .day[data-in-range='true'] {
    background-color: var(--_drc-accent-subtle);
    border-radius: 0;
    opacity: 1;
  }

  .day[data-range-start='true'] {
    background-color: var(--_drc-accent);
    color: var(--_drc-accent-fg);
    border-start-start-radius: var(--mth-radius-sm, 0.375rem);
    border-end-start-radius: var(--mth-radius-sm, 0.375rem);
    border-start-end-radius: 0;
    border-end-end-radius: 0;
    opacity: 1;
  }

  .day[data-range-end='true'] {
    background-color: var(--_drc-accent);
    color: var(--_drc-accent-fg);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    border-start-end-radius: var(--mth-radius-sm, 0.375rem);
    border-end-end-radius: var(--mth-radius-sm, 0.375rem);
    opacity: 1;
  }

  .day[data-range-start='true'][data-range-end='true'] {
    border-radius: var(--mth-radius-sm, 0.375rem);
  }

  .day[data-today='true'] {
    border-color: var(--_drc-accent);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .day[aria-disabled='true'] {
    color: var(--_drc-muted);
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (forced-colors: active) {
    .base,
    .nav-btn {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    .day[data-in-range='true'] {
      border-block: 1px solid Highlight;
      background-color: Canvas;
      color: CanvasText;
    }

    .day[data-range-start='true'],
    .day[data-range-end='true'] {
      background-color: Highlight;
      color: HighlightText;
    }

    .day[aria-disabled='true'] {
      color: GrayText;
    }

    .day:focus-visible,
    .nav-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
