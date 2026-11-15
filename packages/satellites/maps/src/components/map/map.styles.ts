import { css } from '@methane/core';

export const mapStyles = css`
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
    inline-size: 100%;
    min-block-size: 16rem;
    block-size: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .base:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: -2px;
  }

  .canvas {
    position: absolute;
    inset: 0;
    background: var(--mth-color-bg-subtle);
  }

  .fallback-layer {
    position: relative;
    z-index: 1;
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
    pointer-events: none;
  }

  .overlay {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
  }

  .controls {
    display: inline-flex;
    flex-direction: column;
    gap: var(--mth-space-1);
    background: var(--mth-color-surface-raised);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-1);
    box-shadow: var(--mth-shadow-sm);
  }

  .control-btn {
    inline-size: 2rem;
    block-size: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    background: var(--mth-color-surface);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-semibold);
    cursor: pointer;
  }

  .control-btn:hover {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
  }

  .control-btn:focus-visible,
  .marker-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .markers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-1);
  }

  .marker-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-accent);
    border-radius: var(--mth-radius-full);
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .status {
    position: relative;
    z-index: 2;
    align-self: flex-start;
    margin-block: var(--mth-space-2);
    margin-inline: var(--mth-space-3);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    background: var(--mth-color-surface-raised);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    font-family: var(--mth-font-mono);
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  @media (forced-colors: active) {
    .control-btn,
    .marker-btn {
      forced-color-adjust: none;
    }
  }
`;
