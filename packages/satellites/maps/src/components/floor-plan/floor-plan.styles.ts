import { css } from '@methane-ui/core';

export const floorPlanStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
  }

  .level-badge {
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-semibold);
    color: var(--mth-color-fg-muted);
  }

  .controls {
    display: inline-flex;
    gap: var(--mth-space-1);
  }

  .ctrl-btn,
  .room-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .room-btn[aria-pressed='true'] {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    border-color: var(--mth-color-accent);
  }

  .room-btn[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ctrl-btn:focus-visible,
  .room-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .viewport {
    position: relative;
    block-size: 12rem;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background: var(--mth-color-bg-subtle);
    overflow: hidden;
  }

  .svg-stage {
    inline-size: 100%;
    block-size: 100%;
    transform-origin: center;
    transform: translate3d(var(--_fp-pan-x, 0px), var(--_fp-pan-y, 0px), 0) scale(var(--_fp-zoom, 1));
  }

  .room-shape {
    fill: var(--mth-color-surface-raised);
    stroke: var(--mth-color-border-strong);
    stroke-width: 1.5;
    cursor: pointer;
  }

  .room-shape.selected {
    fill: var(--mth-color-accent);
    fill-opacity: 0.25;
    stroke: var(--mth-color-accent);
    stroke-width: 2.5;
  }

  .room-shape.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .room-label {
    fill: var(--mth-color-fg);
    font-size: 10px;
    font-family: var(--mth-font-sans);
    pointer-events: none;
  }

  .rooms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-1);
  }

  @media (forced-colors: active) {
    .room-btn[aria-pressed='true'] {
      forced-color-adjust: none;
    }
  }
`;
