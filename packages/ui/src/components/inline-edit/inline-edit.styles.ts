import { css } from '@methane-ui/core';

export const inlineEditStyles = css`
  :host {
    display: inline-block;
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-md);
    color: var(--mth-color-fg);
    --_min-block: calc(2.25rem * var(--mth-density, 1));
  }

  :host([disabled]) {
    opacity: 0.6;
    pointer-events: none;
  }

  [part='base'] {
    display: inline-flex;
    align-items: center;
    min-inline-size: 6rem;
    max-inline-size: 100%;
  }

  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    min-block-size: var(--_min-block);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid transparent;
    border-radius: var(--mth-radius-md);
    background-color: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: text;
  }

  [part='trigger']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
    border-color: var(--mth-color-border);
  }

  [part='trigger'][data-empty='true'] [part='value'] {
    color: var(--mth-color-fg-subtle);
  }

  [part='input'] {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--_min-block);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border-focus);
    border-radius: var(--mth-radius-md);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    font: inherit;
    outline: none;
  }

  [part='trigger']:focus-visible,
  [part='input']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='trigger']:disabled,
  [part='input']:disabled {
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    [part='trigger'],
    [part='input'] {
      border-color: ButtonText;
      color: CanvasText;
      background-color: Canvas;
    }
  }
`;
