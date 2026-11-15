import { css } from 'lit';

export const treeStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_tree-bg: var(--mth-color-surface, Canvas);
    --_tree-fg: var(--mth-color-fg, CanvasText);
    --_tree-muted: var(--mth-color-fg-muted, GrayText);
    --_tree-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_tree-bg-selected: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_tree-border: var(--mth-color-border, ButtonBorder);
    --_tree-focus-ring: var(--mth-color-border-focus, Highlight);
    --_tree-accent: var(--mth-color-accent, Highlight);
    --_tree-danger: var(--mth-color-danger, LinkText);
    --_tree-viewport-max: 24rem;
  }

  .base {
    background-color: var(--_tree-bg);
    color: var(--_tree-fg);
  }

  .viewport {
    position: relative;
    overflow-block: auto;
    max-block-size: var(--_tree-viewport-max);
  }

  .spacer {
    position: relative;
    block-size: var(--_tree-total-height, auto);
  }

  .window {
    transform: translateY(var(--_tree-offset-y, 0px));
  }

  .data-item {
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-block-size: var(--_tree-item-height, 2rem);
    padding-block: 0.25rem;
    padding-inline-end: var(--mth-space-2, 0.5rem);
    padding-inline-start: calc(var(--_item-depth, 0) * var(--mth-space-4, 1rem) + var(--mth-space-2, 0.5rem));
    border-radius: var(--mth-radius-sm, 0.25rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
    box-sizing: border-box;
  }

  .data-item:hover {
    background-color: var(--_tree-bg-hover);
  }

  .data-item[aria-selected='true'] {
    background-color: var(--_tree-bg-selected);
  }

  .data-item[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .data-item:focus-visible {
    outline: 2px solid var(--_tree-focus-ring);
    outline-offset: -2px;
  }

  .toggle-glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1rem;
    block-size: 1rem;
    color: var(--_tree-muted);
    flex-shrink: 0;
  }

  .toggle-glyph[data-leaf='true'] {
    visibility: hidden;
  }

  .status {
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    color: var(--_tree-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: center;
  }

  .status[data-status='error'] {
    color: var(--_tree-danger);
  }

  .retry {
    appearance: none;
    margin-inline-start: var(--mth-space-2, 0.5rem);
    background: transparent;
    color: var(--_tree-accent);
    border: 1px solid var(--_tree-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  @media (forced-colors: active) {
    .data-item[aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
