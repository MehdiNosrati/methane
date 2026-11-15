import { css } from 'lit';

export const emojiPickerStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.375rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.18 0.01 250)));
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .panel {
    inline-size: var(--mth-emoji-panel-inline-size, 18rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface-raised, light-dark(oklch(1 0 0), oklch(0.2 0.01 250)));
    box-shadow: var(--mth-shadow-md, 0 8px 24px light-dark(oklch(0.2 0.02 250 / 0.12), oklch(0 0 0 / 0.45)));
    padding: var(--mth-space-2, 0.5rem);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .panel.popover {
    position: fixed;
    z-index: var(--mth-z-index-popover, 40);
    margin: 0;
    inset: auto;
  }

  .panel[hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .search {
    flex: 1 1 auto;
    min-inline-size: 0;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .skin-tones {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .tone-btn {
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding: 2px;
    cursor: pointer;
    font-size: 0.875rem;
    line-height: 1;
  }

  .tone-btn[aria-pressed='true'] {
    border-color: var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(0.9 0.01 250), oklch(0.28 0.01 250)));
    padding-block-end: var(--mth-space-1, 0.25rem);
  }

  .category {
    border: none;
    background: transparent;
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.7 0.01 250)));
    padding-block: 2px;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .category[aria-pressed='true'] {
    background: var(--mth-color-accent-subtle, light-dark(oklch(0.92 0.05 255), oklch(0.28 0.08 255)));
    color: inherit;
    font-weight: 600;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--mth-emoji-columns, var(--_emoji-columns, 6)), minmax(0, 1fr));
    gap: 4px;
    max-block-size: var(--mth-emoji-grid-max-block-size, 12rem);
    overflow-block: auto;
  }

  .emoji-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    block-size: 2.25rem;
    border: none;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
  }

  .emoji-button:hover:not(:disabled) {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.01 250), oklch(0.28 0.02 250)));
  }

  .emoji-button[aria-pressed='true'] {
    background: var(--mth-color-accent-subtle, light-dark(oklch(0.92 0.05 255), oklch(0.28 0.08 255)));
  }

  .trigger:focus-visible,
  .search:focus-visible,
  .tone-btn:focus-visible,
  .category:focus-visible,
  .emoji-button:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  .empty {
    grid-column: 1 / -1;
    padding: var(--mth-space-4, 1rem);
    text-align: center;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  @media (forced-colors: active) {
    .trigger,
    .panel,
    .search {
      border-color: ButtonText;
    }

    .emoji-button[aria-pressed='true'],
    .category[aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
`;
