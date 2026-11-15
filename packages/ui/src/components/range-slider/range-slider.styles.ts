import { css } from 'lit';

export const rangeSliderStyles = css`
  :host {
    display: block;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(oklch(0.208 0.042 266), oklch(0.984 0.003 248)));
    --_track-size: 0.375rem;
    --_thumb-size: 1.125rem;
    --_range-start-pct: 25%;
    --_range-end-pct: 75%;
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

  :host([disabled]) .track-wrap,
  :host([readonly]) .track-wrap {
    cursor: default;
  }

  .track {
    position: relative;
    inline-size: 100%;
    block-size: var(--_track-size);
    border-radius: 9999px;
    background-color: var(--mth-range-slider-track-bg, var(--mth-color-border, light-dark(oklch(0.869 0.022 253), oklch(0.372 0.044 257))));
    overflow: hidden;
  }

  .fill {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: var(--_range-start-pct);
    inline-size: calc(var(--_range-end-pct) - var(--_range-start-pct));
    block-size: 100%;
    background-color: var(--mth-range-slider-fill-bg, var(--mth-color-accent, oklch(0.55 0.22 255)));
  }

  .thumb {
    position: absolute;
    inset-block-start: 50%;
    transform: translate(-50%, -50%);
    inline-size: var(--_thumb-size);
    block-size: var(--_thumb-size);
    border-radius: 9999px;
    background-color: var(--mth-range-slider-thumb-bg, var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.208 0.042 266))));
    border: 2px solid var(--mth-range-slider-fill-bg, var(--mth-color-accent, oklch(0.55 0.22 255)));
    box-sizing: border-box;
    outline: none;
  }

  :host(:dir(rtl)) .thumb {
    transform: translate(50%, -50%);
  }

  .thumb-start {
    inset-inline-start: var(--_range-start-pct);
  }

  .thumb-end {
    inset-inline-start: var(--_range-end-pct);
  }

  .thumb:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 2px;
    z-index: 2;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.446 0.043 257), oklch(0.704 0.04 257)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
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
