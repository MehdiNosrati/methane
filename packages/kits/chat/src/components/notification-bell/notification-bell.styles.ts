import { css } from 'lit';

export const notificationBellStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .root {
    display: inline-flex;
    position: relative;
    align-items: center;
  }

  .trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    padding-block: 0;
    padding-inline: 0;
    border-width: 1px;
    border-style: solid;
    border-color: var(--mth-color-border);
    border-radius: var(--mth-radius-full);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    cursor: pointer;
    transition-property: background-color, border-color;
    transition-duration: var(--mth-motion-duration-fast);
    transition-timing-function: var(--mth-motion-easing-standard);
  }

  .trigger:hover {
    background-color: var(--mth-color-bg-subtle);
    border-color: var(--mth-color-border-strong);
  }

  .trigger:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .bell-icon {
    inline-size: 1.25rem;
    block-size: 1.25rem;
  }

  .badge-wrap {
    position: absolute;
    inset-block-start: -0.25rem;
    inset-inline-end: -0.25rem;
    pointer-events: none;
  }

  .panel {
    position: fixed;
    z-index: var(--mth-z-index-popover);
    inline-size: min(24rem, calc(100vi - 2rem));
    max-block-size: 26rem;
    display: none;
    flex-direction: column;
    border-width: 1px;
    border-style: solid;
    border-color: var(--mth-color-border);
    border-radius: var(--mth-radius-lg);
    background-color: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    box-shadow: var(--mth-shadow-lg);
    overflow: hidden;
  }

  .panel.open {
    display: flex;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-4);
    border-block-end: 1px solid var(--mth-color-border);
  }

  .heading {
    margin-block: 0;
    margin-inline: 0;
    font-size: var(--mth-font-size-md);
    font-weight: var(--mth-font-weight-semibold);
    line-height: var(--mth-line-height-tight);
  }

  .header-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2);
  }

  .action-btn {
    border: none;
    background: transparent;
    color: var(--mth-color-accent);
    font-family: inherit;
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-medium);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border-radius: var(--mth-radius-sm);
    cursor: pointer;
  }

  .action-btn:hover {
    background-color: var(--mth-color-accent-subtle);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .list {
    list-style: none;
    margin-block: 0;
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0;
    overflow-block: auto;
    flex: 1 1 auto;
  }

  .item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-4);
    border-block-end: 1px solid var(--mth-color-border);
  }

  .item:last-child {
    border-block-end: none;
  }

  .item.unread {
    background-color: var(--mth-color-accent-subtle);
  }

  .dot {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    margin-block-start: 0.4rem;
    border-radius: var(--mth-radius-full);
    background-color: var(--mth-color-accent);
  }

  .dot.read {
    background-color: transparent;
    border-width: 1px;
    border-style: solid;
    border-color: var(--mth-color-border-strong);
  }

  .item-body {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1);
    min-inline-size: 0;
    text-align: start;
    border: none;
    background: transparent;
    padding-block: 0;
    padding-inline: 0;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
  }

  .item-body:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--mth-radius-xs);
  }

  .item-title {
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-semibold);
    line-height: var(--mth-line-height-tight);
  }

  .item-message {
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-muted);
    line-height: var(--mth-line-height-normal);
    overflow-wrap: anywhere;
  }

  .item-time {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-subtle);
  }

  .dismiss-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border: none;
    border-radius: var(--mth-radius-sm);
    background: transparent;
    color: var(--mth-color-fg-subtle);
    cursor: pointer;
  }

  .dismiss-btn:hover {
    background-color: var(--mth-color-bg-subtle);
    color: var(--mth-color-fg);
  }

  .dismiss-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .empty {
    padding-block: var(--mth-space-8);
    padding-inline: var(--mth-space-4);
    text-align: center;
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-muted);
  }

  @media (forced-colors: active) {
    .trigger,
    .panel {
      border-color: ButtonText;
    }

    .dot {
      background-color: Highlight;
    }

    .dot.read {
      background-color: Canvas;
      border-color: ButtonText;
    }
  }
`;
