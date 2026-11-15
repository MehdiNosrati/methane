import { css } from '@methane/core';

export const copyButtonStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
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
    min-block-size: var(--mth-space-control-md);
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
    min-block-size: var(--mth-space-control-sm);
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    font-size: var(--mth-font-size-xs);
  }

  :host([size='lg']) [part='base'] {
    min-block-size: var(--mth-space-control-lg);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-4);
    font-size: var(--mth-font-size-md);
  }

  :host([variant='ghost']) [part='base'] {
    border-color: transparent;
    background-color: transparent;
  }

  :host([variant='solid']) [part='base'] {
    background-color: var(--mth-color-accent);
    border-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
  }

  [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
    border-color: var(--mth-color-border-strong);
  }

  :host([variant='solid']) [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-accent-hover);
    border-color: var(--mth-color-accent-hover);
  }

  [part='base'][data-copied='true'] {
    border-color: var(--mth-color-success);
    color: var(--mth-color-success);
  }

  :host([variant='solid']) [part='base'][data-copied='true'] {
    background-color: var(--mth-color-success);
    border-color: var(--mth-color-success);
    color: var(--mth-color-accent-fg);
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
      background-color: ButtonFace;
      color: ButtonText;
    }

    [part='base'][data-copied='true'] {
      border-color: Highlight;
    }
  }
`;
