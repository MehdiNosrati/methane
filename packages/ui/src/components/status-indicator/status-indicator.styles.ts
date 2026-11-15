import { css } from 'lit';

export const statusIndicatorStyles = css`
  :host {
    --_dot: var(--mth-color-fg-muted, oklch(52% 0.01 260));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_dot-size: 0.625rem;

    display: inline-flex;
    align-items: center;
    color: var(--_fg);
  }

  :host([size='sm']) {
    --_dot-size: 0.5rem;
  }

  :host([size='lg']) {
    --_dot-size: 0.75rem;
  }

  :host([status='online']) {
    --_dot: var(--mth-color-success, oklch(54% 0.17 145));
  }

  :host([status='busy']),
  :host([status='error']) {
    --_dot: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  :host([status='away']),
  :host([status='warning']) {
    --_dot: var(--mth-color-warning, oklch(66% 0.17 85));
  }

  :host([status='info']) {
    --_dot: var(--mth-color-info, oklch(54% 0.17 250));
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .dot {
    inline-size: var(--_dot-size);
    block-size: var(--_dot-size);
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_dot);
    flex-shrink: 0;
  }

  :host([pulse]) .dot {
    box-shadow: 0 0 0 0 var(--_dot);
    animation: mth-status-pulse 1.8s infinite;
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: 1.25;
  }

  @keyframes mth-status-pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
    100% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([pulse]) .dot {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .dot {
      background: Highlight;
      border: 1px solid CanvasText;
    }
  }
`;
