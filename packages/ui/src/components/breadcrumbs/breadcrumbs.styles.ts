import { css } from 'lit';

export const breadcrumbsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  [part='list'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;
