import { css } from 'lit';

export const listStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_list-border: var(--mth-color-border, ButtonBorder);
    --_list-gap: var(--mth-space-1, 0.25rem);
    --_list-bg: var(--mth-color-surface, Canvas);
    --_list-bg-selected: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_list-fg: var(--mth-color-fg, CanvasText);
    --_list-muted: var(--mth-color-fg-muted, GrayText);
    --_list-focus-ring: var(--mth-color-border-focus, Highlight);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--_list-gap);
    background-color: var(--_list-bg);
    color: var(--_list-fg);
  }

  :host([dense]) .base {
    gap: 0;
  }

  :host([dividers]) ::slotted(mth-list-item:not(:last-child)) {
    border-block-end: 1px solid var(--_list-border);
  }

  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-radius: var(--mth-radius-md, 0.375rem);
    cursor: pointer;
  }

  :host([dense]) .item-row {
    padding-block: var(--mth-space-1, 0.25rem);
  }

  :host([dividers]) .item-row:not(:last-child) {
    border-block-end: 1px solid var(--_list-border);
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  .item-row[aria-selected='true'] {
    background-color: var(--_list-bg-selected);
  }

  .item-row[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .item-row:focus-visible {
    outline: 2px solid var(--_list-focus-ring);
    outline-offset: -2px;
  }

  .item-title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .item-desc {
    color: var(--_list-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .empty {
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    color: var(--_list-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: center;
  }

  @media (forced-colors: active) {
    .item-row[aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
