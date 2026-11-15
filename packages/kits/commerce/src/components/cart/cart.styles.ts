import { css } from 'lit';

export const cartStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-4, 1rem);
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.34 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block-end: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(0.91 0.006 260), oklch(0.3 0.012 260)));
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
    min-inline-size: 0;
    flex: 1 1 auto;
  }

  .thumb {
    inline-size: 3.5rem;
    block-size: 3.5rem;
    border-radius: var(--mth-radius-md, 0.5rem);
    object-fit: cover;
    flex-shrink: 0;
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.006 260), oklch(0.25 0.01 260)));
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    min-inline-size: 0;
  }

  .title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: inherit;
    text-decoration: none;
  }

  .variant {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .controls {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    flex-shrink: 0;
  }

  .qty-group {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .qty-btn,
  .remove-btn {
    appearance: none;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.008 260), oklch(0.36 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: transparent;
    color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.72 0.18 25)));
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .qty-btn {
    color: inherit;
  }

  .qty-btn:disabled,
  .remove-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .total-row {
    padding-block-start: var(--mth-space-2, 0.5rem);
    border-block-start: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.34 0.015 260)));
    font-weight: var(--mth-font-weight-semibold, 600);
    font-size: var(--mth-font-size-md, 1rem);
  }

  .empty {
    padding-block: var(--mth-space-6, 1.5rem);
    text-align: center;
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .remove-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .root,
    .remove-btn {
      border: 1px solid CanvasText;
    }
  }
`;
