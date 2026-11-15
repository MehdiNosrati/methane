import { css } from '@methane-ui/core';

export const splitPaneStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
  }

  [part='base'] {
    display: grid;
    inline-size: 100%;
    block-size: 100%;
    min-inline-size: 0;
    min-block-size: 0;
    grid-template-columns: minmax(0, 50fr) auto minmax(0, 50fr);
    grid-template-rows: minmax(0, 1fr);
  }

  :host([orientation='vertical']) [part='base'] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 50fr) auto minmax(0, 50fr);
  }

  [part='start'],
  [part='end'] {
    min-inline-size: 0;
    min-block-size: 0;
    overflow: auto;
  }

  [part='divider'] {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--mth-color-border);
    inline-size: 0.375rem;
    block-size: 100%;
    cursor: col-resize;
    touch-action: none;
    user-select: none;
    transition: background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  :host([orientation='vertical']) [part='divider'] {
    inline-size: 100%;
    block-size: 0.375rem;
    cursor: row-resize;
  }

  [part='divider']:hover,
  :host(:state(dragging)) [part='divider'] {
    background-color: var(--mth-color-accent);
  }

  [part='divider']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 1px;
    background-color: var(--mth-color-accent);
  }

  :host([disabled]) [part='divider'] {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='divider'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='divider'] {
      background-color: ButtonText;
    }
  }
`;
