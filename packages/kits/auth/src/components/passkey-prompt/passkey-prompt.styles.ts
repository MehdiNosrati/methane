import { css } from '@methane/core';

export const passkeyPromptStyles = css`
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

  .header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(94% 0.04 255), oklch(26% 0.05 255)));
    color: var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255)));
    flex-shrink: 0;
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .description,
  .account-text {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
  }

  .account-text {
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .status-banner {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .status-banner[data-tone='success'] {
    background-color: var(--mth-color-success-subtle, light-dark(oklch(94% 0.05 150), oklch(25% 0.06 150)));
    color: var(--mth-color-success, light-dark(oklch(48% 0.16 150), oklch(72% 0.14 150)));
  }

  .status-banner[data-tone='warning'] {
    background-color: var(--mth-color-warning-subtle, light-dark(oklch(95% 0.06 85), oklch(26% 0.06 80)));
    color: var(--mth-color-warning, light-dark(oklch(55% 0.16 70), oklch(76% 0.14 75)));
  }

  .status-banner[data-tone='danger'] {
    background-color: var(--mth-color-danger-subtle, light-dark(oklch(94% 0.05 25), oklch(25% 0.06 25)));
    color: var(--mth-color-danger, light-dark(oklch(55% 0.22 25), oklch(68% 0.19 25)));
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
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

  .primary-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    outline-offset: 2px;
  }

  .primary-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .fallback-btn {
    padding-block: var(--mth-space-2, 0.5rem);
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

  .fallback-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    outline-offset: 2px;
  }

  .fallback-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .card,
    .status-banner {
      border: 1px solid CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .primary-btn {
      forced-color-adjust: none;
      border: 1px solid ButtonText;
      background-color: Highlight;
      color: HighlightText;
    }

    .primary-btn:focus-visible,
    .fallback-btn:focus-visible {
      outline: 2px solid Highlight;
    }

    .primary-btn:disabled,
    .fallback-btn:disabled {
      border-color: GrayText;
      color: GrayText;
      background-color: Canvas;
    }
  }
`;
