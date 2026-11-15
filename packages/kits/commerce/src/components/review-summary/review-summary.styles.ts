import { css } from 'lit';

export const reviewSummaryStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .root {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--mth-space-4, 1rem);
    align-items: center;
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
  }

  .overview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-inline-size: 6rem;
  }

  .score {
    font-size: var(--mth-font-size-2xl, 1.75rem);
    font-weight: var(--mth-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
  }

  .stars {
    color: var(--mth-color-warning, light-dark(oklch(0.68 0.16 75), oklch(0.78 0.14 75)));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .total {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .row {
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    display: grid;
    grid-template-columns: 4rem 1fr 2.5rem;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: 0.25rem;
    cursor: pointer;
    text-align: start;
  }

  .row[aria-pressed='true'] {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(0.95 0.03 260), oklch(0.27 0.07 260)));
  }

  .track {
    position: relative;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.92 0.006 260), oklch(0.28 0.012 260)));
    overflow: hidden;
  }

  .fill {
    display: block;
    block-size: 100%;
    inline-size: var(--_rs-pct, 0%);
    border-radius: inherit;
    background-color: var(--mth-color-warning, light-dark(oklch(0.68 0.16 75), oklch(0.78 0.14 75)));
  }

  .count {
    text-align: end;
    font-variant-numeric: tabular-nums;
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .row:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .root,
    .track {
      border: 1px solid CanvasText;
    }

    .fill {
      background-color: Highlight;
    }

    .row[aria-pressed='true'] {
      forced-color-adjust: none;
      border: 1px solid Highlight;
    }
  }
`;
