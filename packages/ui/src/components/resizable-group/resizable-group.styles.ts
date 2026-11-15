import { css } from '@methane-ui/core';

export const resizableGroupStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
  }

  [part='base'] {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    inline-size: 100%;
    block-size: 100%;
    min-inline-size: 0;
    min-block-size: 0;
  }

  :host([orientation='vertical']) [part='base'] {
    flex-direction: column;
  }
`;
