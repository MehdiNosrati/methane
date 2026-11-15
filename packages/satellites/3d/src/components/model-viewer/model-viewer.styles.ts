import { css } from 'lit';

export const modelViewerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_model-min-height: 22rem;
  }

  .base {
    display: flex;
    flex-direction: column;
    inline-size: 100%;
    position: relative;
  }

  .viewport {
    position: relative;
    inline-size: 100%;
    min-block-size: var(--mth-model-height, var(--_model-min-height));
    background-color: var(--mth-color-bg-subtle, oklch(0.95 0.01 260));
    overflow: hidden;
  }

  .viewport:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: -2px;
  }

  .canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: var(--mth-model-height, var(--_model-min-height));
  }

  .poster {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .poster[hidden],
  .controls[hidden],
  .status[hidden] {
    display: none;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
    border-block-start: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
  }

  button {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: 2px;
  }

  .status {
    position: absolute;
    inset-block-end: var(--mth-space-3, 0.75rem);
    inset-inline-start: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
  }

  .fallback {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    button {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }
  }
`;
