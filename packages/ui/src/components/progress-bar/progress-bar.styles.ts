import { css } from 'lit';

export const progressBarStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_progress: 0%;
    --_progress-track: var(--mth-color-bg-subtle, oklch(0.94 0.008 255));
    --_progress-fill: var(--mth-color-accent, Highlight);
    --_progress-fg: var(--mth-color-fg, CanvasText);
    --_progress-border: var(--mth-color-border, ButtonBorder);
    --_progress-radius: var(--mth-radius-full, 9999px);
    --_progress-height: 0.5rem;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--_progress-fg);
  }

  .label[hidden] {
    display: none;
  }

  .track {
    position: relative;
    inline-size: 100%;
    block-size: var(--_progress-height);
    border-radius: var(--_progress-radius);
    background-color: var(--_progress-track);
    border: 1px solid var(--_progress-border);
    overflow: hidden;
  }

  .fill {
    inline-size: var(--_progress, 0%);
    block-size: 100%;
    border-radius: inherit;
    background-color: var(--_progress-fill);
    transition: inline-size var(--mth-motion-duration-fast, 120ms)
      var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .track[data-indeterminate='true'] .fill {
    inline-size: 40%;
    animation: mth-progress-indeterminate 1.4s ease-in-out infinite;
  }

  @keyframes mth-progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(350%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }

    .track[data-indeterminate='true'] .fill {
      animation: none;
      inline-size: 100%;
      opacity: 0.65;
    }
  }

  @media (forced-colors: active) {
    .track {
      background-color: Canvas;
      border: 1px solid ButtonBorder;
    }

    .fill {
      background-color: Highlight;
    }
  }
`;
