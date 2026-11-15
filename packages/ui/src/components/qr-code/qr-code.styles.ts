import { css } from 'lit';

export const qrCodeStyles = css`
  :host {
    display: inline-block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-qr-fg, var(--mth-color-fg, light-dark(oklch(0.15 0.01 250), oklch(0.95 0.01 250))));
  }

  .base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_qr-size, 160px);
    block-size: var(--_qr-size, 160px);
    background: var(--mth-qr-bg, var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.01 250))));
    border-radius: var(--mth-radius-sm, 0.375rem);
    overflow: hidden;
  }

  .svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    shape-rendering: crispEdges;
  }

  .empty {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.72 0.01 250)));
    text-align: center;
    padding: var(--mth-space-2, 0.5rem);
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
