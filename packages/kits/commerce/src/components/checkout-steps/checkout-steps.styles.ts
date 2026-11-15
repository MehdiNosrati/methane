import { css } from 'lit';

export const checkoutStepsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--mth-space-3, 0.75rem);
  }

  .list[data-orientation='vertical'] {
    flex-direction: column;
  }

  .step {
    flex: 1 1 0;
    min-inline-size: 9rem;
  }

  .step-btn {
    appearance: none;
    inline-size: 100%;
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    color: inherit;
    font-family: inherit;
    text-align: start;
    cursor: pointer;
  }

  .step-btn[aria-current='step'] {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(0.95 0.03 260), oklch(0.27 0.07 260)));
  }

  .step-btn[aria-disabled='true'],
  .step-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .indicator {
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.94 0.006 260), oklch(0.28 0.012 260)));
  }

  .step-btn[aria-current='step'] .indicator {
    background-color: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.68 0.18 260)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.99 0 0)));
  }

  .step-btn[data-completed='true'] .indicator {
    background-color: var(--mth-color-success, light-dark(oklch(0.56 0.16 145), oklch(0.68 0.15 145)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.99 0 0)));
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-inline-size: 0;
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .desc {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.72 0.18 25)));
  }

  .step-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .step-btn {
      border: 1px solid CanvasText;
    }

    .step-btn[aria-current='step'] {
      forced-color-adjust: none;
      border: 2px solid Highlight;
    }

    .step-btn:disabled {
      opacity: 1;
      color: GrayText;
    }
  }
`;
