import { css } from 'lit';

export const availabilityPickerStyles = css`
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
    user-select: none;
  }

  .toolbar {
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

  .matrix {
    display: grid;
    grid-template-columns: 4.5rem repeat(var(--_slot-cols, 5), minmax(0, 1fr));
    gap: 0.25rem;
    align-items: center;
  }

  .slot-header {
    text-align: center;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .day-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .slot-cell,
  .clear-btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.375rem;
    padding-inline: 0.25rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .slot-cell[aria-pressed='true'] {
    background: var(--mth-color-accent, oklch(0.55 0.2 255));
    color: var(--mth-color-accent-fg, oklch(0.99 0 0));
    border-color: var(--mth-color-accent, oklch(0.55 0.2 255));
  }

  .slot-cell:disabled,
  .clear-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .slot-cell:focus-visible,
  .clear-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.58 0.18 255));
    outline-offset: 2px;
  }

  .error-text {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, light-dark(oklch(0.52 0.2 25), oklch(0.75 0.18 25)));
  }

  .error-text[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .slot-cell,
    .clear-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .slot-cell,
    .clear-btn {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .slot-cell[aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
