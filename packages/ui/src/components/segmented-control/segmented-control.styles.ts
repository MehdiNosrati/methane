import { css } from 'lit';

export const segmentedControlStyles = css`
  :host {
    display: inline-block;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(#0f172a, #f8fafc));
    --_seg-count: 1;
    --_seg-index: 0;
    --_seg-pad-y: 0.375rem;
    --_seg-pad-x: 0.75rem;
    --_seg-font: var(--mth-font-size-sm, 0.875rem);
  }

  :host([full-width]) {
    display: block;
    inline-size: 100%;
  }

  :host([size='sm']) {
    --_seg-pad-y: 0.25rem;
    --_seg-pad-x: 0.625rem;
    --_seg-font: var(--mth-font-size-xs, 0.75rem);
  }

  :host([size='lg']) {
    --_seg-pad-y: 0.5rem;
    --_seg-pad-x: 1rem;
    --_seg-font: var(--mth-font-size-md, 1rem);
  }

  :host([disabled]) {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .track {
    position: relative;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    padding: 0.1875rem;
    border-radius: 0.5rem;
    background-color: var(--mth-segmented-bg, var(--mth-color-bg-subtle, light-dark(#f1f5f9, #1e293b)));
    border: 1px solid var(--mth-color-border, light-dark(#e2e8f0, #334155));
    isolation: isolate;
  }

  .indicator {
    position: absolute;
    inset-block-start: 0.1875rem;
    inset-block-end: 0.1875rem;
    inset-inline-start: 0.1875rem;
    inline-size: calc((100% - 0.375rem) / max(var(--_seg-count), 1));
    border-radius: 0.375rem;
    background-color: var(
      --mth-segmented-indicator-bg,
      var(--mth-color-surface, light-dark(#ffffff, #0f172a))
    );
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.08);
    transform: translateX(calc(var(--_seg-index) * 100%));
    transition: transform var(--mth-motion-duration-fast, 120ms) ease;
    pointer-events: none;
    z-index: 0;
  }

  :host(:dir(rtl)) .indicator {
    transform: translateX(calc(var(--_seg-index) * -100%));
  }

  :host([data-has-selection='false']) .indicator {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator {
      transition: none;
    }
  }

  .segment {
    position: relative;
    z-index: 1;
    appearance: none;
    border: none;
    background: transparent;
    color: var(--mth-color-fg-muted, light-dark(#475569, #94a3b8));
    font-family: inherit;
    font-size: var(--_seg-font);
    font-weight: 500;
    padding-block: var(--_seg-pad-y);
    padding-inline: var(--_seg-pad-x);
    border-radius: 0.375rem;
    cursor: pointer;
    text-align: center;
    white-space: nowrap;
    transition: color var(--mth-motion-duration-fast, 120ms) ease;
  }

  .segment[aria-checked='true'] {
    color: var(--mth-segmented-fg-active, var(--mth-color-fg, light-dark(#0f172a, #f8fafc)));
  }

  .segment:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .segment:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 1px;
  }

  .slot-source {
    display: none;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(#475569, #94a3b8));
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

    .indicator {
      background-color: Highlight;
      box-shadow: none;
    }

    .segment {
      color: ButtonText;
    }

    .segment[aria-checked='true'] {
      color: HighlightText;
    }

    .segment:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
