import { css } from 'lit';

export const infiniteScrollStyles = css`
  :host {
    display: block;
    --_scroll-bg: var(--mth-color-surface, Canvas);
    --_scroll-fg: var(--mth-color-fg, CanvasText);
    --_scroll-muted: var(--mth-color-fg-muted, GrayText);
    --_scroll-border: var(--mth-color-border, ButtonBorder);
    --_scroll-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--_scroll-fg);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .item {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_scroll-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_scroll-bg);
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
  }

  .sentinel {
    inline-size: 100%;
    block-size: 1px;
  }

  .status {
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_scroll-muted);
  }

  .status[data-error='true'] {
    color: var(--_scroll-danger);
  }

  .action-btn {
    padding-block: var(--mth-space-control-block, 0.4375rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 1px solid var(--_scroll-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--_scroll-bg);
    color: var(--_scroll-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .item,
    .action-btn {
      border-color: CanvasText;
    }
  }
`;
