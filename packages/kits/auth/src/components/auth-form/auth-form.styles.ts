import { css } from 'lit';

export const authFormStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_af-bg: var(--mth-color-surface, oklch(99% 0 0));
    --_af-fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_af-border: var(--mth-color-border, oklch(86% 0.01 260));
    --_af-focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_af-danger: var(--mth-color-danger, oklch(55% 0.22 25));
    --_af-radius: var(--mth-radius-lg, 0.75rem);
  }

  :host([hidden]) {
    display: none;
  }

  .card {
    padding-block: var(--mth-space-6, 1.5rem);
    padding-inline: var(--mth-space-6, 1.5rem);
    border: 1px solid var(--_af-border);
    border-radius: var(--_af-radius);
    background-color: var(--_af-bg);
    color: var(--_af-fg);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-4, 1rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-xl, 1.25rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .input {
    inline-size: 100%;
    box-sizing: border-box;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_af-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--_af-bg);
    color: var(--_af-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .input:focus-visible {
    outline: 2px solid var(--_af-focus);
    outline-offset: 1px;
  }

  .input[aria-invalid='true'] {
    border-color: var(--_af-danger);
  }

  .error-banner[hidden] {
    display: none;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }
`;
