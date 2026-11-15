import { css } from 'lit';

export const typingIndicatorStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .base[hidden] {
    display: none;
  }

  .dots {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .dot {
    inline-size: 0.375rem;
    block-size: 0.375rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    animation: mth-typing-bounce var(--mth-motion-duration-slow, 900ms) infinite ease-in-out;
  }

  .dot:nth-child(2) {
    animation-delay: 150ms;
  }

  .dot:nth-child(3) {
    animation-delay: 300ms;
  }

  :host(:state(reduced-motion)) .dot {
    animation: none;
    opacity: 0.85;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
      opacity: 0.85;
    }
  }

  @keyframes mth-typing-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.45;
    }
    40% {
      transform: translateY(-2px);
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .base {
      color: CanvasText;
    }

    .dot {
      forced-color-adjust: none;
      background-color: Highlight;
    }
  }
`;
