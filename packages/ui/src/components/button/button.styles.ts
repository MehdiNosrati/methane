import { css } from 'lit';

export const buttonStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
    --_btn-bg: var(--mth-color-accent, oklch(0.56 0.21 255));
    --_btn-bg-hover: var(--mth-color-accent-hover, oklch(0.48 0.21 255));
    --_btn-bg-active: var(--mth-color-accent-active, oklch(0.4 0.19 255));
    --_btn-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_btn-border: transparent;
    --_btn-radius: var(--mth-radius-md, 0.375rem);
    --_btn-font-size: var(--mth-font-size-sm, 0.875rem);
    --_btn-pad-block: var(--mth-space-control-block, 0.5rem);
    --_btn-pad-inline: var(--mth-space-4, 1rem);
    --_btn-min-block: 2.25rem;
  }

  :host([size='sm']) {
    --_btn-font-size: var(--mth-font-size-xs, 0.75rem);
    --_btn-pad-block: var(--mth-space-1, 0.25rem);
    --_btn-pad-inline: var(--mth-space-3, 0.75rem);
    --_btn-min-block: 1.875rem;
  }

  :host([size='lg']) {
    --_btn-font-size: var(--mth-font-size-md, 1rem);
    --_btn-pad-block: var(--mth-space-3, 0.75rem);
    --_btn-pad-inline: var(--mth-space-5, 1.25rem);
    --_btn-min-block: 2.75rem;
  }

  :host([variant='outline']) {
    --_btn-bg: var(--mth-color-surface, Canvas);
    --_btn-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_btn-bg-active: var(--mth-color-border, oklch(0.91 0.009 255));
    --_btn-fg: var(--mth-color-fg, CanvasText);
    --_btn-border: var(--mth-color-border-strong, oklch(0.84 0.011 255));
  }

  :host([variant='ghost']) {
    --_btn-bg: transparent;
    --_btn-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_btn-bg-active: var(--mth-color-border, oklch(0.91 0.009 255));
    --_btn-fg: var(--mth-color-fg, CanvasText);
    --_btn-border: transparent;
  }

  :host([variant='danger']) {
    --_btn-bg: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_btn-bg-hover: oklch(0.5 0.22 25);
    --_btn-bg-active: oklch(0.43 0.2 25);
    --_btn-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_btn-border: transparent;
  }

  [part='base'] {
    display: inline-flex;
    inline-size: 100%;
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: 100%;
    min-block-size: var(--_btn-min-block);
    padding-block: var(--_btn-pad-block);
    padding-inline: var(--_btn-pad-inline);
    border: 1px solid var(--_btn-border);
    border-radius: var(--_btn-radius);
    background-color: var(--_btn-bg);
    color: var(--_btn-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--_btn-font-size);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      transform var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  [part='control']:hover:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_btn-bg-hover);
  }

  [part='control']:active:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_btn-bg-active);
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
    animation: mth-btn-spin 700ms linear infinite;
    flex-shrink: 0;
  }

  @keyframes mth-btn-spin {
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

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }

    [part='control']:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
