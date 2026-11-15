import { css } from 'lit';

export const planPickerStyles = css`
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
  }

  .cycle-bar {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.25rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.008 260), oklch(0.36 0.015 260)));
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.006 260), oklch(0.24 0.01 260)));
    gap: 0.25rem;
  }

  .cycle-btn {
    appearance: none;
    border: none;
    border-radius: var(--mth-radius-full, 9999px);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    cursor: pointer;
  }

  .cycle-btn[aria-pressed='true'] {
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.3 0.012 260)));
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: var(--mth-space-4, 1rem);
  }

  .plan-card {
    appearance: none;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.008 260), oklch(0.36 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
    color: inherit;
    font-family: inherit;
    text-align: start;
    cursor: pointer;
  }

  .plan-card[aria-checked='true'] {
    border: 2px solid var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(0.96 0.02 260), oklch(0.26 0.06 260)));
  }

  .plan-card[aria-disabled='true'],
  .plan-card:disabled,
  .cycle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .plan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .plan-name {
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .price-line {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .amount {
    font-size: var(--mth-font-size-xl, 1.35rem);
    font-weight: var(--mth-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
  }

  .suffix {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .desc {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .features {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .cycle-btn:focus-visible,
  .plan-card:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .cycle-bar,
    .plan-card {
      border: 1px solid CanvasText;
    }

    .cycle-btn[aria-pressed='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
    }

    .plan-card[aria-checked='true'] {
      forced-color-adjust: none;
      border: 2px solid Highlight;
    }

    .plan-card:disabled {
      opacity: 1;
      color: GrayText;
    }
  }
`;
