import { css } from '@methane/core';

export const timezonePickerStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  :host([disabled]) {
    opacity: 0.6;
    pointer-events: none;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1);
  }

  [part='label'] {
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-medium);
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    background-color: var(--mth-color-surface);
    overflow: hidden;
  }

  [part='control']:focus-within {
    border-color: var(--mth-color-border-focus);
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 1px;
  }

  [part='input'] {
    flex: 1 1 auto;
    min-inline-size: 11rem;
    min-block-size: var(--mth-space-control-md);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-3);
    border: 0;
    background: transparent;
    color: var(--mth-color-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm);
    outline: none;
  }

  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--mth-space-control-md);
    min-block-size: var(--mth-space-control-md);
    padding-inline: var(--mth-space-2);
    border: 0;
    border-inline-start: 1px solid var(--mth-color-border);
    background-color: var(--mth-color-bg-subtle);
    color: var(--mth-color-fg);
    font: inherit;
    cursor: pointer;
  }

  [part='popover'] {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--mth-z-index-popover);
    min-inline-size: 16rem;
    max-block-size: 16rem;
    overflow-block: auto;
    padding: var(--mth-space-1);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    background-color: var(--mth-color-surface-raised);
    box-shadow: var(--mth-shadow-lg);
  }

  [part='popover'][hidden] {
    display: none;
  }

  [part='listbox'] {
    display: flex;
    flex-direction: column;
    gap: 2px;
    outline: none;
  }

  [part='option'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border-radius: var(--mth-radius-sm);
    font-size: var(--mth-font-size-sm);
    cursor: pointer;
  }

  [part='option']:hover,
  [part='option'][data-active='true'] {
    background-color: var(--mth-color-bg-subtle);
  }

  [part='option'][aria-selected='true'] {
    background-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
  }

  .offset {
    font-size: var(--mth-font-size-xs);
    opacity: 0.75;
  }

  @media (forced-colors: active) {
    [part='control'],
    [part='popover'] {
      border-color: ButtonText;
    }

    [part='option'][aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
