import { css } from 'lit';

export const toggleGroupStyles = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, CanvasText);
    --_tg-bg: var(--mth-color-surface, Canvas);
    --_tg-border: var(--mth-color-border-strong, ButtonBorder);
    --_tg-active-bg: var(--mth-color-accent-subtle, Highlight);
    --_tg-active-fg: var(--mth-color-accent, HighlightText);
    --_tg-radius: var(--mth-radius-md, 0.375rem);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sr-hidden {
    display: none;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  [part='label'] {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--mth-color-fg, CanvasText);
  }

  [part='group'] {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
    border: 1px solid var(--_tg-border);
    border-radius: var(--_tg-radius);
    background-color: var(--_tg-bg);
    overflow: hidden;
  }

  :host([orientation='vertical']) [part='group'] {
    flex-direction: column;
  }

  [part='item'] {
    appearance: none;
    border: 0;
    border-inline-end: 1px solid var(--mth-color-border, ButtonBorder);
    background-color: transparent;
    color: var(--mth-color-fg, CanvasText);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    cursor: pointer;
    transition: background-color var(--mth-motion-duration-fast, 120ms) ease;
  }

  :host([orientation='vertical']) [part='item'] {
    border-inline-end: 0;
    border-block-end: 1px solid var(--mth-color-border, ButtonBorder);
    text-align: start;
  }

  [part='item']:last-child {
    border-inline-end: 0;
    border-block-end: 0;
  }

  :host([size='sm']) [part='item'] {
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
  }

  :host([size='lg']) [part='item'] {
    font-size: var(--mth-font-size-md, 1rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
  }

  [part='item'][aria-pressed='true'] {
    background-color: var(--_tg-active-bg);
    color: var(--_tg-active-fg);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  [part='item']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: -2px;
  }

  [part='item']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :host(:state(invalid)) [part='group'],
  :host(:state(user-invalid)) [part='group'] {
    border-color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  [part='hint'] {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, GrayText);
  }

  [part='error'] {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  @media (forced-colors: active) {
    [part='group'],
    [part='item'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }

    [part='item'][aria-pressed='true'] {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
