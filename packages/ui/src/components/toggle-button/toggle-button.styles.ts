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
    border: 1px solid var(--mth-color-border-strong);
    border-radius: var(--mth-radius-md);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-semibold);
    letter-spacing: -0.01em;
    line-height: var(--mth-line-height-tight);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    box-shadow: var(--mth-shadow-xs);
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      border-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      box-shadow var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      transform var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
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
    box-shadow: none;
  }

  :host([variant='soft']) [part='base'] {
    border-color: transparent;
    background-color: var(--mth-color-accent-subtle);
    color: var(--mth-color-accent);
    box-shadow: none;
  }

  :host([variant='soft']:not([pressed])) [part='base']:hover:not(:disabled) {
    background-color: color-mix(in oklch, var(--mth-color-accent-subtle) 86%, var(--mth-color-accent));
    border-color: oklch(from var(--mth-color-accent) l c h / 0.28);
  }

  :host([variant='outline']) [part='base'],
  :host([variant='outlined']) [part='base'] {
    border-color: var(--mth-color-border-strong);
    background-color: var(--mth-color-surface);
  }

  :host([variant='solid']) [part='base'] {
    border-color: var(--mth-color-border-strong);
    background-color: var(--mth-color-bg-subtle);
  }

  [part='base']:focus-visible {
    outline: var(--mth-focus-ring-width, 2px) solid var(--mth-color-border-focus);
    outline-offset: var(--mth-focus-ring-offset, 2px);
  }

  [part='base']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
    border-color: var(--mth-color-accent);
    box-shadow: var(--mth-shadow-sm);
  }

  [part='base']:active:not(:disabled) {
    transform: translateY(1px);
  }

  :host([pressed]) [part='base'] {
    background-color: var(--mth-color-accent);
    border-color: oklch(from var(--mth-color-accent) calc(l - 0.06) c h / 0.5);
    color: var(--mth-color-accent-fg);
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs);
  }

  :host([pressed]) [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-accent-hover);
    border-color: var(--mth-color-accent-hover);
  }

  @media (prefers-reduced-motion: reduce) {
    [part='base'] {
      transition: none;
    }

    [part='base']:active:not(:disabled) {
      transform: none;
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
