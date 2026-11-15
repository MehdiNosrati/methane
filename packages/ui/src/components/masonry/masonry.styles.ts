import { css } from '@methane-ui/core';

export const masonryStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  [part='base'] {
    display: block;
    inline-size: 100%;
    column-count: 1;
    column-gap: var(--mth-space-4);
  }

  ::slotted(*) {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-block-end: var(--mth-space-4);
    display: block;
  }
`;
