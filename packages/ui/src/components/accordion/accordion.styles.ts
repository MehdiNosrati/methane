import { css } from 'lit';

export const accordionStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_acc-border: var(--mth-color-border, ButtonBorder);
    --_acc-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--_acc-border);
    border-radius: var(--_acc-radius);
    overflow: hidden;
  }

  ::slotted(:last-child) {
    border-block-end: none;
  }

  @media (forced-colors: active) {
    .base {
      border-color: ButtonBorder;
    }
  }
`;
