import { css } from 'lit';

export const tabPanelStyles = css`
  :host {
    display: none;
    box-sizing: border-box;
    padding-block: var(--mth-space-4, 1rem);
  }

  :host([active]),
  :host(:state(active)) {
    display: block;
  }

  [part='base'] {
    display: block;
  }
`;
