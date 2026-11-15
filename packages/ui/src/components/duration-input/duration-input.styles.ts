import { css } from '@methane/core';

export const durationInputStyles = css`
  :host {
    display: inline-block;
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

  [part='group'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    background-color: var(--mth-color-surface);
  }

  [part='group']:focus-within {
    border-color: var(--mth-color-border-focus);
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 1px;
  }

  .segment {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1);
  }

  .seg-input {
    inline-size: 3.25rem;
    min-block-size: var(--mth-space-control-block);
    padding-block: 2px;
    padding-inline: var(--mth-space-1);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background-color: var(--mth-color-bg-subtle);
    color: var(--mth-color-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm);
    text-align: center;
  }

  .unit {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  @media (forced-colors: active) {
    [part='group'],
    .seg-input {
      border-color: ButtonText;
    }
  }
`;
