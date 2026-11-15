import { css } from 'lit';

export const conditionalFieldStyles = css`
  :host {
    display: block;
    --_cond-disabled-opacity: 0.65;
  }

  :host([hidden]),
  .base[hidden] {
    display: none;
  }

  .base[data-inactive-mode='disable'] {
    opacity: var(--_cond-disabled-opacity);
  }

  @media (forced-colors: active) {
    .base[data-inactive-mode='disable'] {
      color: GrayText;
    }
  }
`;
