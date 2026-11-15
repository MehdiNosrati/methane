import { css } from 'lit';

export const barcodeStyles = css`
  :host {
    display: inline-block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-barcode-fg, var(--mth-color-fg, light-dark(oklch(0.15 0.01 250), oklch(0.95 0.01 250))));
  }

  .base {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding: var(--mth-space-2, 0.5rem);
    background: var(--mth-barcode-bg, var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.01 250))));
    border-radius: var(--mth-radius-sm, 0.375rem);
  }

  .svg {
    display: block;
    inline-size: 100%;
    block-size: var(--_barcode-height, 56px);
    shape-rendering: crispEdges;
  }

  .caption {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    letter-spacing: 0.08em;
  }

  .empty {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.72 0.01 250)));
  }

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }

    .base {
      background: Canvas;
      border: 1px solid CanvasText;
    }
  }
`;
