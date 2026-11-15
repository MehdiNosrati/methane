import { css } from '@methane-ui/core';

export const mfaChallengeStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
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
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface-raised, light-dark(oklch(100% 0 0), oklch(19% 0.01 260)));
    box-shadow: var(--mth-shadow-sm, 0 1px 2px light-dark(oklch(0% 0 0 / 0.06), oklch(0% 0 0 / 0.25)));
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
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  .description {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
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
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xl, 1.25rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    text-align: center;
    outline: none;
    transition: border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      box-shadow var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .digit:focus-visible {
    border-color: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255))) 25%, transparent);
  }

  .digit[aria-invalid='true'] {
    border-color: var(--mth-color-danger, light-dark(oklch(55% 0.22 25), oklch(68% 0.19 25)));
  }

  .digit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
  }

  .backup-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .backup-label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  .backup-input {
    inline-size: 100%;
    box-sizing: border-box;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-md, 1rem);
    outline: none;
  }

  .backup-input:focus-visible {
    border-color: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255))) 25%, transparent);
  }

  .backup-input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
  }

  .error-text {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-danger, light-dark(oklch(55% 0.22 25), oklch(68% 0.19 25)));
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
    color: var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255)));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .link-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
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
    background-color: var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255)));
    color: var(--mth-color-accent-fg, light-dark(oklch(99% 0 0), oklch(12% 0.01 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    cursor: pointer;
  }

  .submit-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    outline-offset: 2px;
  }

  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .card,
    .digit,
    .backup-input {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .digit[aria-invalid='true'],
    .backup-input[aria-invalid='true'] {
      border-color: Mark;
    }

    .digit:focus-visible,
    .backup-input:focus-visible,
    .link-btn:focus-visible,
    .submit-btn:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    .submit-btn {
      forced-color-adjust: none;
      border: 1px solid ButtonText;
      background-color: Highlight;
      color: HighlightText;
    }

    .digit:disabled,
    .backup-input:disabled,
    .link-btn:disabled,
    .submit-btn:disabled {
      border-color: GrayText;
      color: GrayText;
      background-color: Canvas;
    }
  }
`;
