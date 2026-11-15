import { css } from 'lit';

export const zoomPanStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    position: relative;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 250), oklch(0.2 0.01 250)));
    overflow: hidden;
  }

  .viewport {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
  }

  .viewport[data-dragging='true'] {
    cursor: grabbing;
  }

  .content {
    transform-origin: center center;
    transform: translate(var(--_pan-x, 0px), var(--_pan-y, 0px)) scale(var(--_zoom-scale, 1));
    transition: transform var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .controls {
    position: absolute;
    inset-block-end: var(--mth-space-2, 0.5rem);
    inset-inline-end: var(--mth-space-2, 0.5rem);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0 / 0.92), oklch(0.2 0.01 250 / 0.92)));
    box-shadow: var(--mth-shadow-sm, 0 2px 8px oklch(0 0 0 / 0.15));
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2rem;
    min-block-size: 2rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: none;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .viewport:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .content {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .controls {
      border-color: ButtonText;
    }
  }
`;
