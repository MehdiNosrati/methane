import { css } from '@methane/core';

export const passkeyPromptStyles = css`
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
    background-color: var(--mth-color-accent-subtle, oklch(94% 0.04 255));
    color: var(--mth-color-accent, oklch(55% 0.18 255));
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
    color: var(--mth-color-fg-muted, oklch(48% 0.01 260));
  }

  .account-text {
    color: var(--mth-color-fg, oklch(18% 0.01 260));
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .status-banner {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .status-banner[data-tone='success'] {
    background-color: var(--mth-color-success-subtle, oklch(94% 0.05 150));
    color: var(--mth-color-success, oklch(48% 0.16 150));
  }

  .status-banner[data-tone='warning'] {
    background-color: var(--mth-color-warning-subtle, oklch(95% 0.06 85));
    color: var(--mth-color-warning, oklch(55% 0.16 70));
  }

  .status-banner[data-tone='danger'] {
    background-color: var(--mth-color-danger-subtle, oklch(94% 0.05 25));
    color: var(--mth-color-danger, oklch(55% 0.22 25));
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
    background-color: var(--mth-color-accent, oklch(55% 0.18 255));
    color: var(--mth-color-accent-fg, oklch(99% 0 0));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    cursor: pointer;
  }

  .primary-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
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
    color: var(--mth-color-accent, oklch(55% 0.18 255));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .fallback-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
    outline-offset: 2px;
  }

  .fallback-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
