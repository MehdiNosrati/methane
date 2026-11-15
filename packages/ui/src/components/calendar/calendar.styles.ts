import { css } from 'lit';

export const calendarStyles = css`
  :host {
    display: inline-block;
    --_cal-bg: var(--mth-color-surface, oklch(1 0 0));
    --_cal-subtle: var(--mth-color-bg-subtle, oklch(0.96 0.005 250));
    --_cal-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_cal-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_cal-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_cal-focus: var(--mth-color-border-focus, oklch(0.55 0.2 250));
    --_cal-accent: var(--mth-color-accent, oklch(0.54 0.2 255));
    --_cal-accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_cal-accent-subtle: var(--mth-color-accent-subtle, oklch(0.94 0.04 255));
    --_cal-radius: var(--mth-radius-lg, 0.75rem);
    --_cal-cell-size: var(--mth-space-8, 2.25rem);
    color: var(--_cal-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_cal-border);
    border-radius: var(--_cal-radius);
    background-color: var(--_cal-bg);
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

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    text-align: center;
    flex: 1 1 auto;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--mth-space-8, 2rem);
    block-size: var(--mth-space-8, 2rem);
    padding: 0;
    border: 1px solid var(--_cal-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_cal-bg);
    color: var(--_cal-fg);
    font: inherit;
    cursor: pointer;
  }

  .nav-btn:hover:not(:disabled) {
    background-color: var(--_cal-subtle);
  }

  .nav-btn:focus-visible {
    outline: 2px solid var(--_cal-focus);
    outline-offset: 2px;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .grid {
    border-collapse: collapse;
    table-layout: fixed;
    inline-size: 100%;
  }

  .weekday {
    padding-block: var(--mth-space-1, 0.25rem);
    color: var(--_cal-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    text-align: center;
  }

  .cell {
    padding: var(--mth-space-px, 1px);
    text-align: center;
  }

  .day {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_cal-cell-size);
    block-size: var(--_cal-cell-size);
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_cal-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .day:hover:not([aria-disabled='true']) {
    background-color: var(--_cal-subtle);
  }

  .day:focus-visible {
    outline: 2px solid var(--_cal-focus);
    outline-offset: 2px;
  }

  .day[data-outside='true'] {
    color: var(--_cal-muted);
    opacity: 0.65;
  }

  .day[data-today='true'] {
    border-color: var(--_cal-accent);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .day[data-selected='true'] {
    background-color: var(--_cal-accent);
    color: var(--_cal-accent-fg);
    border-color: var(--_cal-accent);
    opacity: 1;
  }

  .day[aria-disabled='true'] {
    color: var(--_cal-muted);
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

    .day[data-today='true'] {
      border-color: Highlight;
    }

    .day[data-selected='true'] {
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
