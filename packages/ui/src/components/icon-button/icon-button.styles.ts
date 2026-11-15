import { css } from 'lit';

export const iconButtonStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
    --_ib-size: 2.25rem;
    --_ib-bg: transparent;
    --_ib-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_ib-bg-active: var(--mth-color-border, oklch(0.91 0.009 255));
    --_ib-fg: var(--mth-color-fg, CanvasText);
    --_ib-border: transparent;
  }

  :host([size='sm']) {
    --_ib-size: 1.875rem;
  }

  :host([size='lg']) {
    --_ib-size: 2.75rem;
  }

  :host([variant='solid']) {
    --_ib-bg: var(--mth-color-accent, oklch(0.56 0.21 255));
    --_ib-bg-hover: var(--mth-color-accent-hover, oklch(0.48 0.21 255));
    --_ib-bg-active: var(--mth-color-accent-active, oklch(0.4 0.19 255));
    --_ib-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
  }

  :host([variant='outline']) {
    --_ib-bg: var(--mth-color-surface, Canvas);
    --_ib-border: var(--mth-color-border-strong, oklch(0.84 0.011 255));
  }

  :host([variant='danger']) {
    --_ib-bg: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_ib-bg-hover: oklch(0.5 0.22 25);
    --_ib-bg-active: oklch(0.43 0.2 25);
    --_ib-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
  }

  :host(:state(pressed)) [part='control'] {
    background-color: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    border-color: var(--mth-color-accent, oklch(0.56 0.21 255));
  }

  [part='base'] {
    display: inline-flex;
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_ib-size);
    block-size: var(--_ib-size);
    padding: 0;
    border: 1px solid var(--_ib-border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--_ib-bg);
    color: var(--_ib-fg);
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  [part='control']:hover:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_ib-bg-hover);
  }

  [part='control']:active:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_ib-bg-active);
  }

  [part='control']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  :host(:state(disabled)) [part='control'],
  :host([disabled]) [part='control'] {
    opacity: 0.52;
    cursor: not-allowed;
  }

  :host(:state(loading)) [part='control'],
  :host([loading]) [part='control'] {
    cursor: progress;
  }

  [part='spinner'] {
    inline-size: 1em;
    block-size: 1em;
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: var(--mth-radius-full, 9999px);
    animation: mth-ib-spin 700ms linear infinite;
  }

  @keyframes mth-ib-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='control'] {
      transition: none;
    }

    [part='spinner'] {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    [part='control'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }

    :host(:state(pressed)) [part='control'] {
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }
  }
`;
