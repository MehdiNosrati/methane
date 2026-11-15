import { css } from '@methane-ui/core';

export const resizablePanelStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
    flex: 1 1 0%;
    overflow: auto;
  }

  :host([collapsed]) {
    overflow: hidden;
  }

  [part='base'] {
    inline-size: 100%;
    block-size: 100%;
    min-inline-size: 0;
    min-block-size: 0;
  }
`;
