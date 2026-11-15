import { css } from 'lit';

export const quantitySelectorStyles = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .root {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.008 260), oklch(0.38 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    overflow: hidden;
  }

  .step-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: inherit;
    min-inline-size: 2.25rem;
    min-block-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-family: inherit;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .step-btn:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.006 260), oklch(0.27 0.012 260)));
  }

  .step-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .input {
    appearance: none;
    border-block: none;
    border-inline: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.34 0.015 260)));
    background: transparent;
    color: inherit;
    inline-size: 3.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    text-align: center;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-variant-numeric: tabular-nums;
  }

  .input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .step-btn:focus-visible,
  .input:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: -2px;
  }

  @media (forced-colors: active) {
    .root {
      border: 1px solid CanvasText;
    }

    .input {
      border-inline: 1px solid CanvasText;
    }

    .step-btn:disabled,
    .input:disabled {
      opacity: 1;
      color: GrayText;
    }
  }
`;
