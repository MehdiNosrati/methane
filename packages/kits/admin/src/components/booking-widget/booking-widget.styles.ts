import { css } from 'lit';

export const bookingWidgetStyles = css`
  :host {
    display: block;
    color: var(--mth-color-fg, light-dark(oklch(0.18 0.02 260), oklch(0.94 0.01 260)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: grid;
    grid-template-columns: minmax(15rem, 1fr) minmax(12rem, 16rem);
    gap: var(--mth-space-4, 1rem);
    padding: var(--mth-space-4, 1rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
  }

  .calendar {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .weekdays,
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
  }

  .weekday {
    text-align: center;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .btn,
  .day-btn,
  .slot-btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.375rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .day-btn[data-outside='true'] {
    color: var(--mth-color-fg-muted, light-dark(oklch(0.5 0.02 260), oklch(0.65 0.02 260)));
  }

  .day-btn[aria-pressed='true'],
  .slot-btn[aria-pressed='true'],
  .confirm-btn {
    background: var(--mth-color-accent, oklch(0.55 0.2 255));
    color: var(--mth-color-accent-fg, oklch(0.99 0 0));
    border-color: var(--mth-color-accent, oklch(0.55 0.2 255));
  }

  .slots-panel {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .slot-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.375rem;
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error-text {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, light-dark(oklch(0.52 0.2 25), oklch(0.75 0.18 25)));
  }

  .error-text[hidden] {
    display: none;
  }

  .btn:disabled,
  .day-btn:disabled,
  .slot-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn:focus-visible,
  .day-btn:focus-visible,
  .slot-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.58 0.18 255));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .day-btn,
    .slot-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .btn,
    .day-btn,
    .slot-btn,
    .summary {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .day-btn[aria-pressed='true'],
    .slot-btn[aria-pressed='true'],
    .confirm-btn {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
