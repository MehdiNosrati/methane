import { css } from '@methane/core';

export const mfaChallengeStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, oklch(18% 0.01 260));
  }

  :host([hidden]),
  [hidden] {
    display: none;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-5, 1.25rem);
    padding-inline: var(--mth-space-5, 1.25rem);
    border: 1px solid var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface-raised, oklch(100% 0 0));
    box-shadow: var(--mth-shadow-sm, 0 1px 2px oklch(0% 0 0 / 0.06));
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    color: var(--mth-color-fg, oklch(18% 0.01 260));
  }

  .description {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--mth-color-fg-muted, oklch(48% 0.01 260));
  }

  .digits {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .digit {
    inline-size: 2.75rem;
    block-size: 3rem;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, oklch(99% 0 0));
    color: var(--mth-color-fg, oklch(18% 0.01 260));
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xl, 1.25rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    text-align: center;
    outline: none;
    transition: border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      box-shadow var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .digit:focus-visible {
    border-color: var(--mth-color-border-focus, oklch(55% 0.18 255));
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--mth-color-accent, oklch(55% 0.18 255)) 25%, transparent);
  }

  .digit[aria-invalid='true'] {
    border-color: var(--mth-color-danger, oklch(55% 0.22 25));
  }

  .digit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background-color: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
  }

  .backup-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .backup-label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--mth-color-fg, oklch(18% 0.01 260));
  }

  .backup-input {
    inline-size: 100%;
    box-sizing: border-box;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, oklch(99% 0 0));
    color: var(--mth-color-fg, oklch(18% 0.01 260));
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-md, 1rem);
    outline: none;
  }

  .backup-input:focus-visible {
    border-color: var(--mth-color-border-focus, oklch(55% 0.18 255));
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--mth-color-accent, oklch(55% 0.18 255)) 25%, transparent);
  }

  .backup-input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background-color: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
  }

  .error-text {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-danger, oklch(55% 0.22 25));
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .secondary-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .link-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 0;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--mth-color-accent, oklch(55% 0.18 255));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .link-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
    outline-offset: 2px;
  }

  .link-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submit-btn {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 0;
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-accent, oklch(55% 0.18 255));
    color: var(--mth-color-accent-fg, oklch(99% 0 0));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    cursor: pointer;
  }

  .submit-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
    outline-offset: 2px;
  }

  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
