import { css } from 'lit';

export const tabsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    --_tabs-border: var(--mth-color-border, oklch(0.89 0.01 262));
    --_tabs-gap: var(--mth-space-1, 0.25rem);
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
  }

  :host([orientation='vertical']) [part='base'] {
    flex-direction: row;
    align-items: stretch;
    gap: var(--mth-space-4, 1rem);
  }

  [part='tablist'] {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--_tabs-gap);
    border-block-end: 1px solid var(--_tabs-border);
  }

  :host([orientation='vertical']) [part='tablist'] {
    flex-direction: column;
    flex-wrap: nowrap;
    border-block-end: none;
    border-inline-end: 1px solid var(--_tabs-border);
    padding-inline-end: var(--mth-space-2, 0.5rem);
  }

  [part='panels'] {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  @media (forced-colors: active) {
    [part='tablist'] {
      border-color: ButtonBorder;
    }
  }
`;
