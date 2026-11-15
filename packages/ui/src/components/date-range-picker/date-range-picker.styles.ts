import { css } from '@methane/core';

export const dateRangePickerStyles = css`
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
    min-inline-size: 13.5rem;
    min-block-size: var(--mth-space-control-block);
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
    min-inline-size: var(--mth-space-control-block);
    min-block-size: var(--mth-space-control-block);
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
    min-inline-size: 17.5rem;
    padding: var(--mth-space-3);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-lg);
    background-color: var(--mth-color-surface-raised);
    box-shadow: var(--mth-shadow-lg);
  }

  [part='popover'][hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--mth-space-2);
  }

  .nav-btn {
    min-inline-size: 2rem;
    min-block-size: 2rem;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    cursor: pointer;
  }

  .month-title {
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-semibold);
  }

  .weekdays,
  .week-row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 2px;
    text-align: center;
  }

  .weekday {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
    padding-block: var(--mth-space-1);
  }

  [part='day'] {
    min-block-size: 2rem;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm);
    background: transparent;
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  [part='day'][data-outside='true'] {
    color: var(--mth-color-fg-subtle);
  }

  [part='day'][data-in-range='true'] {
    background-color: var(--mth-color-accent-subtle);
  }

  [part='day'][aria-selected='true'] {
    background-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    font-weight: var(--mth-font-weight-semibold);
  }

  [part='trigger']:focus-visible,
  [part='day']:focus-visible,
  .nav-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    [part='control'],
    [part='popover'],
    .nav-btn {
      border-color: ButtonText;
    }

    [part='day'][aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
