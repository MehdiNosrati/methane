import { css } from 'lit';

export const eventCalendarStyles = css`
  :host {
    display: block;
    color: var(--mth-color-fg, light-dark(oklch(0.18 0.02 260), oklch(0.94 0.01 260)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .nav-group,
  .view-group {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .period-title {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    padding-inline: var(--mth-space-2, 0.5rem);
  }

  .btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 260), oklch(0.34 0.02 260)));
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .btn[aria-pressed='true'] {
    background: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 255)));
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
    text-align: center;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .weekdays[hidden] {
    display: none;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
  }

  .grid[data-view='day'] {
    grid-template-columns: 1fr;
  }

  .day-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-block-size: 5rem;
    padding: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.3 0.02 260)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
  }

  .day-cell[data-outside='true'] {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.02 260), oklch(0.68 0.02 260)));
  }

  .day-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
  }

  .day-trigger {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    cursor: pointer;
    padding: 0.125rem 0.25rem;
    border-radius: var(--mth-radius-sm, 0.375rem);
  }

  .add-btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding: 0 0.25rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .event-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    inline-size: 100%;
    text-align: start;
    border: 1px solid var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.03 255), oklch(0.24 0.04 255)));
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding: 0.1875rem 0.375rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .day-trigger:focus-visible,
  .add-btn:focus-visible,
  .event-chip:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.58 0.18 255), oklch(0.74 0.16 255)));
    outline-offset: 2px;
  }

  .day-agenda {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .hour-slot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.3 0.02 260)));
    border-radius: var(--mth-radius-sm, 0.375rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .event-chip {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .day-cell,
    .btn,
    .add-btn,
    .event-chip,
    .hour-slot {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .btn[aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
