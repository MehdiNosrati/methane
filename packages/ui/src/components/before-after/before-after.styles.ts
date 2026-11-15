import { css } from 'lit';

export const beforeAfterStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    position: relative;
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--mth-before-after-aspect-ratio, 16 / 9);
    border-radius: var(--mth-radius-md, 0.5rem);
    overflow: hidden;
    user-select: none;
    touch-action: none;
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 250), oklch(0.2 0.01 250)));
  }

  :host([disabled]) .base {
    opacity: 0.55;
    pointer-events: none;
  }

  .after,
  .before {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }

  .before {
    clip-path: inset(0 calc(100% - var(--_split-position, 50%)) 0 0);
  }

  :host([dir='rtl']) .before {
    clip-path: inset(0 0 0 calc(100% - var(--_split-position, 50%)));
  }

  .divider {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--_split-position, 50%);
    inline-size: 2px;
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.98 0 0)));
    box-shadow: var(--mth-shadow-sm, 0 1px 4px oklch(0 0 0 / 0.35));
    transform: translateX(-50%);
    pointer-events: none;
  }

  .handle {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: var(--_split-position, 50%);
    transform: translate(-50%, -50%);
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border: 2px solid var(--mth-color-surface, oklch(1 0 0));
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    color: var(--mth-color-accent-fg, oklch(1 0 0));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: ew-resize;
    box-shadow: var(--mth-shadow-md, 0 4px 12px oklch(0 0 0 / 0.25));
  }

  .handle:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .divider {
      background: Highlight;
    }

    .handle {
      border-color: ButtonText;
      background: Highlight;
      color: HighlightText;
    }
  }
`;
