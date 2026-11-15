import { css } from 'lit';

export const loadingOverlayStyles = css`
  :host {
    --_backdrop: var(--mth-color-backdrop, oklch(98% 0.005 260 / 0.78));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_track: var(--mth-color-border, oklch(85% 0.01 260));
    --_z: var(--mth-z-index-overlay, 300);

    display: block;
    position: relative;
    color: var(--_fg);
  }

  .base {
    position: relative;
    display: block;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    z-index: var(--_z);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    background: var(--_backdrop);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
  }

  :host([fullscreen]) .backdrop {
    position: fixed;
  }

  :host([blurred]) .backdrop {
    backdrop-filter: blur(4px);
  }

  .backdrop[hidden] {
    display: none;
  }

  .spinner {
    inline-size: 2rem;
    block-size: 2rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 3px solid var(--_track);
    border-block-start-color: var(--_accent);
    animation: mth-loading-spin 0.8s linear infinite;
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  @keyframes mth-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .backdrop {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    .spinner {
      border-color: GrayText;
      border-block-start-color: Highlight;
    }
  }
`;
