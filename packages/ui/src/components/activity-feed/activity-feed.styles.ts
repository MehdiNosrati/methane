import { css } from 'lit';

export const activityFeedStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_af-bg: var(--mth-color-surface, Canvas);
    --_af-fg: var(--mth-color-fg, CanvasText);
    --_af-muted: var(--mth-color-fg-muted, GrayText);
    --_af-border: var(--mth-color-border, ButtonBorder);
    --_af-accent: var(--mth-color-accent, Highlight);
    --_af-danger: var(--mth-color-danger, LinkText);
  }

  .base {
    display: flex;
    flex-direction: column;
    background-color: var(--_af-bg);
    color: var(--_af-fg);
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-block-end: 1px solid var(--_af-border);
  }

  .item:last-child {
    border-block-end: none;
  }

  .item-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .title-line {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .actor {
    font-weight: var(--mth-font-weight-semibold, 600);
    margin-inline-end: var(--mth-space-1, 0.25rem);
  }

  .timestamp {
    color: var(--_af-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    flex-shrink: 0;
  }

  .description {
    color: var(--_af-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    color: var(--_af-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .status[data-status='error'] {
    color: var(--_af-danger);
  }

  .retry {
    appearance: none;
    background: transparent;
    color: var(--_af-accent);
    border: 1px solid var(--_af-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  @media (forced-colors: active) {
    .retry {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }
  }
`;
