import { css } from '@methane-ui/core';

export const profileMenuStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  :host([hidden]),
  [hidden] {
    display: none;
  }

  .trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
    transition: background-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .trigger-btn:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
  }

  .trigger-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    outline-offset: 2px;
  }

  .trigger-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .trigger-name {
    max-inline-size: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-surface {
    position: fixed;
    margin: 0;
    z-index: var(--mth-z-index-popover, 100);
    min-inline-size: 14rem;
    max-inline-size: 20rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: 0;
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface-raised, light-dark(oklch(100% 0 0), oklch(19% 0.01 260)));
    box-shadow: var(--mth-shadow-lg, 0 10px 25px light-dark(oklch(0% 0 0 / 0.14), oklch(0% 0 0 / 0.4)));
  }

  .account-header {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    margin-block-end: var(--mth-space-1, 0.25rem);
  }

  .account-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .account-name {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  .account-email {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
    overflow-wrap: anywhere;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-inline: var(--mth-space-1, 0.25rem);
  }

  .menu-separator {
    block-size: 1px;
    margin-block: var(--mth-space-1, 0.25rem);
    background-color: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: 100%;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 0;
    border-radius: var(--mth-radius-md, 0.5rem);
    background: transparent;
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: start;
    cursor: pointer;
  }

  .menu-item:hover:not(:disabled),
  .menu-item:focus-visible {
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
    outline: none;
  }

  .menu-item[data-danger='true'] {
    color: var(--mth-color-danger, light-dark(oklch(55% 0.22 25), oklch(68% 0.19 25)));
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .trigger-btn {
      border-color: ButtonText;
      background-color: Canvas;
      color: ButtonText;
    }

    .trigger-btn:focus-visible {
      outline: 2px solid Highlight;
    }

    .menu-surface {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .menu-item:hover:not(:disabled),
    .menu-item:focus-visible {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      outline: 2px solid Highlight;
    }

    .trigger-btn:disabled,
    .menu-item:disabled {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
