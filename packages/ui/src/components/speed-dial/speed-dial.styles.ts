import { css } from '@methane/core';

export const speedDialStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
  }

  [part='base'] {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 3.5rem;
    block-size: 3.5rem;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-full);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-md);
    font-weight: var(--mth-font-weight-semibold);
    background-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    box-shadow: var(--mth-shadow-lg);
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      transform var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  :host([size='sm']) [part='trigger'] {
    inline-size: 2.5rem;
    block-size: 2.5rem;
  }

  :host([size='lg']) [part='trigger'] {
    inline-size: 4rem;
    block-size: 4rem;
  }

  :host([variant='surface']) [part='trigger'] {
    background-color: var(--mth-color-surface-raised);
    color: var(--mth-color-accent);
    border-color: var(--mth-color-border);
  }

  :host([variant='secondary']) [part='trigger'] {
    background-color: var(--mth-color-accent-subtle);
    color: var(--mth-color-accent);
  }

  [part='trigger']:hover:not(:disabled) {
    background-color: var(--mth-color-accent-hover);
  }

  :host([variant='surface']) [part='trigger']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
  }

  [part='trigger']:focus-visible,
  [part='action']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='trigger']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part='actions'] {
    position: absolute;
    display: flex;
    gap: var(--mth-space-2);
    z-index: var(--mth-z-index-popover);
  }

  [part='actions'][hidden] {
    display: none;
  }

  :host([direction='up']) [part='actions'] {
    flex-direction: column-reverse;
    inset-block-end: calc(100% + var(--mth-space-3));
    inset-inline-start: 50%;
    transform: translateX(-50%);
  }

  :host([direction='down']) [part='actions'] {
    flex-direction: column;
    inset-block-start: calc(100% + var(--mth-space-3));
    inset-inline-start: 50%;
    transform: translateX(-50%);
  }

  :host([direction='start']) [part='actions'] {
    flex-direction: row-reverse;
    inset-inline-end: calc(100% + var(--mth-space-3));
    inset-block-start: 50%;
    transform: translateY(-50%);
  }

  :host([direction='end']) [part='actions'] {
    flex-direction: row;
    inset-inline-start: calc(100% + var(--mth-space-3));
    inset-block-start: 50%;
    transform: translateY(-50%);
  }

  [part='action'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2);
    min-inline-size: 2.5rem;
    block-size: 2.5rem;
    padding-inline: var(--mth-space-3);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-full);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-medium);
    background-color: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    box-shadow: var(--mth-shadow-md);
    white-space: nowrap;
    cursor: pointer;
    transition: background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  [part='action']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
  }

  [part='action']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='trigger'],
    [part='action'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='trigger'],
    [part='action'] {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }
  }
`;
