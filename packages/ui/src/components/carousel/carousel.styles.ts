import { css } from 'lit';

export const carouselStyles = css`
  :host {
    display: block;
    position: relative;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .viewport {
    position: relative;
  }

  .track {
    display: flex;
    flex-direction: row;
    gap: var(--mth-carousel-gap, 0px);
    overflow-inline: auto;
    scroll-snap-type: inline mandatory;
    scroll-behavior: smooth;
    scrollbar-width: none;
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .track::-webkit-scrollbar {
    display: none;
  }

  @supports selector(::scroll-button(inline-start)) {
    .track::scroll-button(inline-start),
    .track::scroll-button(inline-end) {
      border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
      border-radius: var(--mth-radius-full, 9999px);
      background: var(--mth-color-surface, light-dark(oklch(1 0 0 / 0.9), oklch(0.2 0.01 250 / 0.9)));
      color: inherit;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      cursor: pointer;
    }
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    pointer-events: none;
    position: absolute;
    inset-block-start: 50%;
    inset-inline: var(--mth-space-2, 0.5rem);
    transform: translateY(-50%);
  }

  .nav-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0 / 0.92), oklch(0.2 0.01 250 / 0.92)));
    color: inherit;
    font: inherit;
    cursor: pointer;
    box-shadow: var(--mth-shadow-sm, 0 2px 8px light-dark(oklch(0.2 0.02 250 / 0.12), oklch(0 0 0 / 0.4)));
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .indicators {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .indicator {
    inline-size: 0.625rem;
    block-size: 0.625rem;
    padding: 0;
    border: 1px solid var(--mth-color-border-strong, light-dark(oklch(0.6 0.02 250), oklch(0.5 0.02 250)));
    border-radius: var(--mth-radius-full, 9999px);
    background: transparent;
    cursor: pointer;
    transition: background var(--mth-motion-duration-fast, 150ms) var(--mth-motion-easing-standard, ease);
  }

  .indicator[aria-pressed='true'] {
    background: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.7 0.18 255)));
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.7 0.18 255)));
    inline-size: 1.25rem;
  }

  .nav-btn:focus-visible,
  .indicator:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .track {
      scroll-behavior: auto;
    }

    .indicator {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .nav-btn,
    .indicator {
      border-color: ButtonText;
    }

    .indicator[aria-pressed='true'] {
      background: Highlight;
      border-color: Highlight;
    }
  }
`;
