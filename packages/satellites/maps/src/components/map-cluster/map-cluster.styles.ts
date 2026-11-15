import { css } from '@methane/core';

export const mapClusterStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: 100%;
    min-block-size: 14rem;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    overflow: hidden;
  }

  .base {
    position: relative;
    min-block-size: 14rem;
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

  .layer {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
  }

  .clusters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2);
  }

  .cluster-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-3);
    border: 1px solid var(--mth-color-accent);
    border-radius: var(--mth-radius-full);
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-semibold);
    cursor: pointer;
  }

  .cluster-btn.single {
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    border-color: var(--mth-color-border-strong);
  }

  .cluster-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .summary {
    position: relative;
    z-index: 2;
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
    background: var(--mth-color-surface-raised);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    align-self: flex-start;
  }

  @media (forced-colors: active) {
    .cluster-btn {
      forced-color-adjust: none;
    }
  }
`;
