import { css } from 'lit';

export const settingsShellStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 260), oklch(0.94 0.01 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(0.99 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .base {
    display: grid;
    grid-template-columns: minmax(12rem, 15rem) 1fr;
    min-block-size: 20rem;
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    padding: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.01 260), oklch(0.32 0.02 260)));
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
  }

  .nav-item {
    text-align: start;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 260), oklch(0.94 0.01 260)));
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    cursor: pointer;
  }

  .nav-item[aria-selected='true'] {
    background-color: var(--mth-color-accent, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 255)));
  }

  .main {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  .content {
    flex: 1;
    padding: var(--mth-space-4, 1rem);
  }

  .section-title {
    margin-block: 0 var(--mth-space-3, 0.75rem);
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .save-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-block-start: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.01 260), oklch(0.32 0.02 260)));
    background-color: var(--mth-color-surface-raised, light-dark(oklch(0.96 0.01 260), oklch(0.2 0.015 260)));
  }

  .save-bar[hidden],
  .section-title[hidden] {
    display: none;
  }

  .save-actions {
    display: flex;
    gap: var(--mth-space-2, 0.5rem);
  }

  .action-btn {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 260), oklch(0.94 0.01 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(0.99 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    cursor: pointer;
  }

  .action-btn[data-primary='true'] {
    background-color: var(--mth-color-accent, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 255)));
    border-color: var(--mth-color-accent, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
  }

  button:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 250), oklch(0.72 0.18 250)));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    button {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }

    .nav-item[aria-selected='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
