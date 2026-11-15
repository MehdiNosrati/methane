import { css } from 'lit';

export const fileExplorerStyles = css`
  :host {
    display: block;
    color: var(--mth-color-fg, light-dark(oklch(0.18 0.02 260), oklch(0.94 0.01 260)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid
      var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
  }

  .breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .crumb-btn,
  .view-btn,
  .tree-btn {
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .crumb-btn:hover,
  .tree-btn:hover,
  .view-btn:hover {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.93 0.01 260), oklch(0.26 0.02 260)));
  }

  .view-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .view-btn[aria-pressed='true'],
  .tree-btn[aria-current='location'] {
    background: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 255)));
  }

  .panes {
    display: grid;
    grid-template-columns: minmax(11rem, 14rem) 1fr;
    min-block-size: 14rem;
  }

  .tree {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--mth-space-2, 0.5rem);
    border-inline-end: 1px solid
      var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
  }

  .tree-btn {
    text-align: start;
    inline-size: 100%;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--mth-space-3, 0.75rem);
  }

  .entries[data-mode='grid'] {
    display: grid;
    grid-template-columns: repeat(var(--_grid-columns, 3), minmax(0, 1fr));
    gap: var(--mth-space-2, 0.5rem);
    align-content: start;
  }

  .entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.3 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    color: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
    text-align: start;
  }

  .entries[data-mode='grid'] .entry {
    flex-direction: column;
    align-items: flex-start;
  }

  .entry[aria-selected='true'] {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.03 255), oklch(0.24 0.04 255)));
  }

  .entry:focus-visible,
  .crumb-btn:focus-visible,
  .view-btn:focus-visible,
  .tree-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.58 0.18 255), oklch(0.74 0.16 255)));
    outline-offset: 2px;
  }

  .entry-meta {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .empty {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  .footer-status {
    padding-block: 0.375rem;
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid
      var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  @media (prefers-reduced-motion: reduce) {
    .entry,
    .crumb-btn,
    .view-btn,
    .tree-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .entry,
    .view-btn,
    .tree-btn {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .entry[aria-selected='true'],
    .view-btn[aria-pressed='true'],
    .tree-btn[aria-current='location'] {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
