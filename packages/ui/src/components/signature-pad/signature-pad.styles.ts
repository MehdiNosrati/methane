import { css } from 'lit';

export const signaturePadStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 600;
  }

  .canvas {
    display: block;
    inline-size: 100%;
    block-size: 10rem;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
    touch-action: none;
    cursor: crosshair;
  }

  :host(:state(disabled)) .canvas {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :host(:state(invalid)) .canvas {
    border-color: var(--mth-color-danger);
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .typed-input {
    flex: 1 1 10rem;
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface);
    color: var(--mth-color-fg);
  }

  .actions {
    display: flex;
    gap: var(--mth-space-2, 0.5rem);
  }

  .action-btn {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    color: var(--mth-color-fg);
  }

  .action-btn:disabled {
    cursor: not-allowed;
  }

  .canvas:focus-visible,
  .typed-input:focus-visible,
  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .canvas,
    .typed-input,
    .action-btn {
      border-color: ButtonText;
    }
  }
`;
