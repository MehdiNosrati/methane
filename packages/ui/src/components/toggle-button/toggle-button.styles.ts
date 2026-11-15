import { css } from '@methane/core';

export const toggleButtonStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    --_min-block: calc(2.25rem * var(--mth-density, 1));
  }

  :host([size='sm']) {
    --_min-block: calc(1.875rem * var(--mth-density, 1));
  }

  :host([size='lg']) {
    --_min-block: calc(2.75rem * var(--mth-density, 1));
  }

  :host([disabled]) {
    pointer-events: none;
  }

  [part='base'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2);
    box-sizing: border-box;
    min-block-size: var(--_min-block);
    padding-block: var(--mth-space-2);
    padding-inline: var(--mth-space-3);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-medium);
    line-height: var(--mth-line-height-tight);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      border-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  :host([size='sm']) [part='base'] {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    font-size: var(--mth-font-size-xs);
  }

  :host([size='lg']) [part='base'] {
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-4);
    font-size: var(--mth-font-size-md);
  }

  :host([variant='ghost']) [part='base'] {
    border-color: transparent;
    background-color: transparent;
  }

  :host([variant='solid']) [part='base'] {
    border-color: var(--mth-color-border-strong);
    background-color: var(--mth-color-bg-subtle);
  }

  [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
    border-color: var(--mth-color-border-strong);
  }

  :host([pressed]) [part='base'] {
    background-color: var(--mth-color-accent);
    border-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
  }

  :host([pressed]) [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-accent-hover);
    border-color: var(--mth-color-accent-hover);
  }

  [part='base']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='base']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='base'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-color: ButtonText;
      color: ButtonText;
      background-color: ButtonFace;
    }

    :host([pressed]) [part='base'] {
      border-color: Highlight;
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
