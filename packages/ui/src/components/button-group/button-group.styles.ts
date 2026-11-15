import { css } from 'lit';

export const buttonGroupStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
    --_bg-gap: var(--mth-space-2, 0.5rem);
  }

  :host([attached]) {
    --_bg-gap: 0px;
  }

  [part='base'] {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--_bg-gap);
  }

  :host([orientation='vertical']) [part='base'] {
    flex-direction: column;
    align-items: stretch;
  }

  :host([attached]) [part='base'] {
    flex-wrap: nowrap;
  }

  :host([attached]:not([orientation='vertical'])) ::slotted(*:not(:first-child)) {
    margin-inline-start: -1px;
  }

  :host([attached][orientation='vertical']) ::slotted(*:not(:first-child)) {
    margin-block-start: -1px;
  }

  ::slotted(*:focus-within) {
    position: relative;
    z-index: 1;
  }
`;
