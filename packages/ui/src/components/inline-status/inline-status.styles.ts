import { css } from 'lit';

export const inlineStatusStyles = css`
  :host {
    --_color: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    display: inline-flex;
    align-items: center;
    color: var(--_color);
  }

  :host([variant='info']),
  :host([variant='loading']) {
    --_color: var(--mth-color-info, oklch(52% 0.16 250));
  }

  :host([variant='success']) {
    --_color: var(--mth-color-success, oklch(50% 0.16 145));
  }

  :host([variant='warning']) {
    --_color: var(--mth-color-warning, oklch(62% 0.17 85));
  }

  :host([variant='danger']) {
    --_color: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: 1.25;
  }

  .spinner {
    inline-size: 0.75rem;
    block-size: 0.75rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 2px solid currentColor;
    border-block-start-color: transparent;
    animation: mth-inline-spin 0.8s linear infinite;
  }

  .dot {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: currentColor;
  }

  @keyframes mth-inline-spin {
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
    :host {
      color: CanvasText;
    }
  }
`;
