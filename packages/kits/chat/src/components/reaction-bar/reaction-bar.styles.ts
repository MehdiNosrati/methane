import { css } from 'lit';

export const reactionBarStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .pill,
  .add-button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-px, 0.125rem);
    min-block-size: 1.75rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    cursor: pointer;
  }

  .pill[aria-pressed='true'] {
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 260), oklch(0.28 0.08 260)));
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    color: var(--mth-color-accent, light-dark(oklch(0.42 0.22 260), oklch(0.84 0.14 260)));
  }

  .pill:focus-visible,
  .add-button:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    outline-offset: 2px;
  }

  .pill:disabled,
  .add-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .pill,
    .add-button {
      border-color: ButtonBorder;
      color: ButtonText;
      background-color: ButtonFace;
    }

    .pill[aria-pressed='true'] {
      forced-color-adjust: none;
      border-color: Highlight;
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
