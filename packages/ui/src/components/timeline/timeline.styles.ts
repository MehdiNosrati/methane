import { css } from 'lit';

export const timelineStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_timeline-fg: var(--mth-color-fg, CanvasText);
    --_timeline-muted: var(--mth-color-fg-muted, GrayText);
    --_timeline-border: var(--mth-color-border, ButtonBorder);
    --_timeline-accent: var(--mth-color-accent, Highlight);
  }

  .base {
    display: flex;
    flex-direction: column;
    color: var(--_timeline-fg);
  }

  :host([orientation='horizontal']) .base {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--mth-space-4, 1rem);
    overflow-inline: auto;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    padding-inline-start: var(--mth-space-4, 1rem);
    padding-block-end: var(--mth-space-4, 1rem);
    border-inline-start: 2px solid var(--_timeline-border);
    position: relative;
  }

  .item::before {
    content: '';
    position: absolute;
    inset-inline-start: -0.3125rem;
    inset-block-start: 0.25rem;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_timeline-accent);
  }

  .item-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .item-heading {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .item-time {
    color: var(--_timeline-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .item-body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .empty {
    color: var(--_timeline-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: var(--mth-space-3, 0.75rem);
  }

  @media (forced-colors: active) {
    .item {
      border-inline-start-color: ButtonBorder;
    }

    .item::before {
      background-color: Highlight;
    }
  }
`;
