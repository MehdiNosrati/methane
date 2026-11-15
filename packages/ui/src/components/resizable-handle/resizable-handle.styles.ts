import { css } from '@methane/core';

export const resizableHandleStyles = css`
  :host {
    display: flex;
    flex: 0 0 auto;
    align-items: stretch;
    justify-content: center;
  }

  [part='base'] {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 0.375rem;
    block-size: 100%;
    background-color: var(--mth-color-border);
    cursor: col-resize;
    touch-action: none;
    user-select: none;
    transition: background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  :host([orientation='vertical']) [part='base'] {
    inline-size: 100%;
    block-size: 0.375rem;
    cursor: row-resize;
  }

  [part='base']:hover,
  :host(:state(dragging)) [part='base'] {
    background-color: var(--mth-color-accent);
  }

  [part='base']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 1px;
    background-color: var(--mth-color-accent);
  }

  :host([disabled]) [part='base'] {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='base'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='base'] {
      background-color: ButtonText;
    }
  }
`;
