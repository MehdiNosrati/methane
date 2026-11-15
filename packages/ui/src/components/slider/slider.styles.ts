import { css } from 'lit';

export const sliderStyles = css`
  :host {
    display: block;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(oklch(0.208 0.042 266), oklch(0.984 0.003 248)));
    --_track-size: 0.375rem;
    --_thumb-size: 1.125rem;
    --_slider-pct: 0%;
  }

  :host([size='sm']) {
    --_track-size: 0.25rem;
    --_thumb-size: 0.875rem;
  }

  :host([size='lg']) {
    --_track-size: 0.5rem;
    --_thumb-size: 1.375rem;
  }

  :host([disabled]) {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
    color: var(--mth-color-fg, light-dark(oklch(0.208 0.042 266), oklch(0.984 0.003 248)));
  }

  .value-readout {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-variant-numeric: tabular-nums;
    color: var(--mth-color-fg-muted, light-dark(oklch(0.446 0.043 257), oklch(0.704 0.04 257)));
  }

  .track-wrap {
    position: relative;
    display: flex;
    align-items: center;
    inline-size: 100%;
    block-size: max(var(--_thumb-size), 1.5rem);
    touch-action: none;
    cursor: pointer;
    user-select: none;
  }

  :host([orientation='vertical']) .track-wrap {
    inline-size: max(var(--_thumb-size), 1.5rem);
    block-size: 12rem;
    justify-content: center;
  }

  :host([disabled]) .track-wrap,
  :host([readonly]) .track-wrap {
    cursor: default;
  }

  .track {
    position: relative;
    inline-size: 100%;
    block-size: var(--_track-size);
    border-radius: 9999px;
    background-color: var(--mth-slider-track-bg, var(--mth-color-border, light-dark(oklch(0.869 0.022 253), oklch(0.372 0.044 257))));
    overflow: hidden;
  }

  :host([orientation='vertical']) .track {
    inline-size: var(--_track-size);
    block-size: 100%;
  }

  .fill {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    block-size: 100%;
    inline-size: var(--_slider-pct);
    background-color: var(--mth-slider-fill-bg, var(--mth-color-accent, oklch(0.55 0.22 255)));
    border-radius: inherit;
  }

  :host([orientation='vertical']) .fill {
    inset-block-start: auto;
    inset-block-end: 0;
    inline-size: 100%;
    block-size: var(--_slider-pct);
  }

  .thumb {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: var(--_slider-pct);
    transform: translate(-50%, -50%);
    inline-size: var(--_thumb-size);
    block-size: var(--_thumb-size);
    border-radius: 9999px;
    background-color: var(--mth-slider-thumb-bg, var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.208 0.042 266))));
    border: 2px solid var(--mth-slider-thumb-border, var(--mth-color-accent, oklch(0.55 0.22 255)));
    box-sizing: border-box;
    outline: none;
    transition: transform var(--mth-motion-duration-fast, 120ms) ease;
  }

  :host(:dir(rtl)) .thumb {
    transform: translate(50%, -50%);
  }

  :host([orientation='vertical']) .thumb {
    inset-block-start: auto;
    inset-block-end: var(--_slider-pct);
    inset-inline-start: 50%;
    transform: translate(-50%, 50%);
  }

  .thumb:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 2px;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.446 0.043 257), oklch(0.704 0.04 257)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    .track {
      border: 1px solid CanvasText;
      background-color: Canvas;
    }

    .fill {
      background-color: Highlight;
    }

    .thumb {
      background-color: ButtonFace;
      border-color: Highlight;
    }

    .thumb:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
