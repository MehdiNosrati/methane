import { css } from '@methane/core';

export const virtualScrollerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  [part='viewport'] {
    position: relative;
    inline-size: 100%;
    block-size: 20rem;
    overflow-block: auto;
    overflow-inline: hidden;
    outline: none;
  }

  [part='viewport']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: -2px;
  }

  [part='spacer'] {
    position: relative;
    inline-size: 100%;
    min-block-size: 1px;
  }

  [part='item'] {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 100%;
    box-sizing: border-box;
  }
`;
