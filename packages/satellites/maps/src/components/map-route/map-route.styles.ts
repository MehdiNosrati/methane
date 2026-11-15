import { css } from '@methane-ui/core';

export const mapRouteStyles = css`
  :host {
    display: block;
    position: relative;
    inline-size: 100%;
    min-block-size: 15rem;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    overflow: hidden;
  }

  .base {
    position: relative;
    min-block-size: 15rem;
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

  .header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
  }

  .summary {
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-medium);
    background: var(--mth-color-surface-raised);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
  }

  .fit-btn,
  .stop-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .fit-btn:hover,
  .stop-btn:hover {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
  }

  .fit-btn:focus-visible,
  .stop-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .svg-route {
    position: relative;
    z-index: 2;
    inline-size: 100%;
    block-size: 7rem;
  }

  .route-line {
    fill: none;
    stroke: var(--mth-color-accent);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .route-node {
    fill: var(--mth-color-accent);
    stroke: var(--mth-color-surface);
    stroke-width: 2;
  }

  .stops {
    position: relative;
    z-index: 2;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-1);
  }

  @media (forced-colors: active) {
    .fit-btn,
    .stop-btn {
      forced-color-adjust: none;
    }
  }
`;
