import { css } from 'lit';

export const paymentFormStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
  }

  .row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--mth-space-3, 0.75rem);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .input {
    appearance: none;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.008 260), oklch(0.38 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.22 0.01 260)));
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    font-variant-numeric: tabular-nums;
  }

  .input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .error {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.55 0.22 25));
  }

  .input:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .form,
    .input {
      border: 1px solid CanvasText;
    }

    .input:disabled {
      opacity: 1;
      color: GrayText;
    }
  }
`;
