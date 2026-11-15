import { css } from 'lit';

export const kanbanStyles = css`
  :host {
    display: block;
    color: var(--mth-color-fg, light-dark(oklch(0.18 0.02 260), oklch(0.94 0.01 260)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .status {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .status[hidden] {
    display: none;
  }

  .board {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(15rem, 1fr);
    gap: var(--mth-space-3, 0.75rem);
    overflow-inline: auto;
    align-items: start;
  }

  .lane {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.2 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    min-block-size: 12rem;
  }

  .lane[data-over-wip='true'] {
    border-color: var(--mth-color-danger, light-dark(oklch(0.56 0.2 25), oklch(0.68 0.18 25)));
  }

  .lane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .lane-title {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .wip-badge {
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.375rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
  }

  .lane[data-over-wip='true'] .wip-badge {
    border-color: var(--mth-color-danger, light-dark(oklch(0.56 0.2 25), oklch(0.68 0.18 25)));
    color: var(--mth-color-danger, light-dark(oklch(0.5 0.2 25), oklch(0.75 0.18 25)));
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    cursor: grab;
    transition: border-color var(--mth-motion-duration-fast, 120ms) ease;
  }

  .card:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.58 0.18 255), oklch(0.74 0.16 255)));
    outline-offset: 2px;
  }

  .card[data-grabbed='true'] {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
  }

  .card-title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .card-actions {
    display: inline-flex;
    gap: 0.25rem;
  }

  .move-btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.125rem;
    padding-inline: 0.375rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .empty-lane {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .lane,
    .card,
    .wip-badge,
    .move-btn {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .card[data-grabbed='true'],
    .card:focus-visible {
      outline: 2px solid Highlight;
      border-color: Highlight;
    }

    .lane[data-over-wip='true'] .wip-badge {
      background: Highlight;
      color: HighlightText;
    }
  }
`;
