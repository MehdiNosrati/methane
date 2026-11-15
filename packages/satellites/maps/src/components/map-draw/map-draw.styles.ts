import { css } from '@methane-ui/core';

export const mapDrawStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: 100%;
    min-block-size: 16rem;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    overflow: hidden;
  }

  .base {
    position: relative;
    min-block-size: 16rem;
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--mth-space-2);
  }

  .canvas {
    position: absolute;
    inset: 0;
    background: var(--mth-color-bg-subtle);
  }

  .toolbar {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-1);
    background: var(--mth-color-surface-raised);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-1);
    align-self: flex-start;
  }

  .tool-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    background: var(--mth-color-surface);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .tool-btn[aria-pressed='true'] {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    border-color: var(--mth-color-accent);
  }

  .tool-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tool-btn:focus-visible,
  .surface:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .surface {
    position: relative;
    z-index: 2;
    inline-size: 100%;
    block-size: 9rem;
    border: 1px dashed var(--mth-color-border-strong);
    border-radius: var(--mth-radius-sm);
    color: var(--mth-color-accent);
    cursor: crosshair;
  }

  .shape {
    fill: var(--mth-color-accent);
    fill-opacity: 0.2;
    stroke: var(--mth-color-accent);
    stroke-width: 2;
  }

  .status {
    position: relative;
    z-index: 2;
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  @media (forced-colors: active) {
    .tool-btn[aria-pressed='true'] {
      forced-color-adjust: none;
    }
  }
`;
