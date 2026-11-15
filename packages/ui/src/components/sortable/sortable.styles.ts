import { css } from '@methane-ui/core';

export const sortableStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  :host([disabled]) {
    opacity: 0.6;
    pointer-events: none;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  :host([orientation='horizontal']) [part='base'] {
    flex-direction: row;
    flex-wrap: wrap;
  }

  [part='item'],
  ::slotted(*) {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-2);
    padding-inline: var(--mth-space-3);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm);
    cursor: grab;
    user-select: none;
  }

  [part='item']:focus-visible,
  ::slotted(:focus-visible) {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='item'][data-grabbed='true'],
  ::slotted([data-grabbed='true']) {
    border-color: var(--mth-color-accent);
    background-color: var(--mth-color-accent-subtle);
    cursor: grabbing;
  }

  @media (forced-colors: active) {
    [part='item'],
    ::slotted(*) {
      border-color: ButtonText;
    }

    [part='item'][data-grabbed='true'],
    ::slotted([data-grabbed='true']) {
      border-color: Highlight;
    }
  }
`;
