import { css } from '@methane/core';

export const fabStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([fixed]) {
    position: fixed;
    z-index: var(--mth-z-index-sticky);
  }

  :host([fixed][placement='bottom-end']) {
    inset-block-end: var(--mth-space-6);
    inset-inline-end: var(--mth-space-6);
  }

  :host([fixed][placement='bottom-start']) {
    inset-block-end: var(--mth-space-6);
    inset-inline-start: var(--mth-space-6);
  }

  :host([fixed][placement='top-end']) {
    inset-block-start: var(--mth-space-6);
    inset-inline-end: var(--mth-space-6);
  }

  :host([fixed][placement='top-start']) {
    inset-block-start: var(--mth-space-6);
    inset-inline-start: var(--mth-space-6);
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
    min-inline-size: 3.5rem;
    block-size: 3.5rem;
    padding-inline: var(--mth-space-4);
    border: 1px solid transparent;
    border-radius: var(--mth-radius-full);
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-semibold);
    line-height: 1;
    background-color: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    box-shadow: var(--mth-shadow-lg);
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      transform var(--mth-motion-duration-fast) var(--mth-motion-easing-standard),
      box-shadow var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  :host([size='sm']) [part='base'] {
    min-inline-size: 2.5rem;
    block-size: 2.5rem;
    padding-inline: var(--mth-space-3);
  }

  :host([size='lg']) [part='base'] {
    min-inline-size: 4rem;
    block-size: 4rem;
    padding-inline: var(--mth-space-5);
    font-size: var(--mth-font-size-md);
  }

  :host(:not([extended])) [part='base'] {
    padding-inline: 0;
  }

  :host([variant='surface']) [part='base'] {
    background-color: var(--mth-color-surface-raised);
    color: var(--mth-color-accent);
    border-color: var(--mth-color-border);
  }

  :host([variant='secondary']) [part='base'] {
    background-color: var(--mth-color-accent-subtle);
    color: var(--mth-color-accent);
  }

  [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-accent-hover);
  }

  :host([variant='surface']) [part='base']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle);
  }

  [part='base']:active:not(:disabled) {
    transform: translateY(1px);
  }

  [part='base']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='base']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part='icon'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  [part='label'] {
    display: inline-flex;
    align-items: center;
  }

  :host(:not([extended])) [part='label'] {
    display: none;
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
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
