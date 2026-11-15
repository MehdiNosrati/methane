import { css } from 'lit';

export const splitButtonStyles = css`
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    --_sb-bg: var(--mth-color-accent, oklch(0.56 0.21 255));
    --_sb-bg-hover: var(--mth-color-accent-hover, oklch(0.48 0.21 255));
    --_sb-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_sb-border: transparent;
    --_sb-divider: oklch(0.99 0 0 / 0.28);
    --_sb-min-block: 2.25rem;
    --_sb-pad-inline: var(--mth-space-3, 0.75rem);
  }

  :host([size='sm']) {
    --_sb-min-block: 1.875rem;
    --_sb-pad-inline: var(--mth-space-2, 0.5rem);
  }

  :host([size='lg']) {
    --_sb-min-block: 2.75rem;
    --_sb-pad-inline: var(--mth-space-4, 1rem);
  }

  :host([variant='outline']) {
    --_sb-bg: var(--mth-color-surface, Canvas);
    --_sb-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_sb-fg: var(--mth-color-fg, CanvasText);
    --_sb-border: var(--mth-color-border-strong, oklch(0.84 0.011 255));
    --_sb-divider: var(--mth-color-border-strong, oklch(0.84 0.011 255));
  }

  :host([variant='ghost']) {
    --_sb-bg: transparent;
    --_sb-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_sb-fg: var(--mth-color-fg, CanvasText);
    --_sb-border: transparent;
    --_sb-divider: var(--mth-color-border, oklch(0.91 0.009 255));
  }

  [part='group'] {
    display: inline-flex;
    align-items: stretch;
  }

  [part='primary'],
  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--_sb-min-block);
    border: 1px solid var(--_sb-border);
    background-color: var(--_sb-bg);
    color: var(--_sb-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
    box-sizing: border-box;
  }

  [part='primary'] {
    padding-inline: var(--_sb-pad-inline);
    border-start-start-radius: var(--mth-radius-md, 0.375rem);
    border-end-start-radius: var(--mth-radius-md, 0.375rem);
  }

  [part='trigger'] {
    min-inline-size: 2rem;
    padding-inline: var(--mth-space-1, 0.25rem);
    border-inline-start: 1px solid var(--_sb-divider);
    border-start-end-radius: var(--mth-radius-md, 0.375rem);
    border-end-end-radius: var(--mth-radius-md, 0.375rem);
  }

  [part='primary']:hover:not(:disabled),
  [part='trigger']:hover:not(:disabled) {
    background-color: var(--_sb-bg-hover);
  }

  [part='primary']:focus-visible,
  [part='trigger']:focus-visible,
  [part='item']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  :host(:state(disabled)) [part='primary'],
  :host(:state(disabled)) [part='trigger'],
  [part='primary']:disabled,
  [part='trigger']:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  [part='menu'] {
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    min-inline-size: 10rem;
    background-color: var(--mth-color-surface-raised, Canvas);
    color: var(--mth-color-fg, CanvasText);
    border: 1px solid var(--mth-color-border, oklch(0.91 0.009 255));
    border-radius: var(--mth-radius-md, 0.375rem);
    box-shadow: var(--mth-shadow-md, 0px 4px 8px -2px oklch(0.15 0.01 255 / 0.12));
    flex-direction: column;
    gap: 2px;
    z-index: var(--mth-z-index-popover, 500);
  }

  [part='menu'][hidden] {
    display: none;
  }

  [part='menu']:not([hidden]) {
    display: flex;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    inline-size: 100%;
    text-align: start;
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 0;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: transparent;
    color: var(--mth-color-fg, CanvasText);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  [part='item']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
  }

  [part='item']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    [part='primary'],
    [part='trigger'],
    [part='item'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }

    [part='menu'] {
      background-color: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }

    [part='primary']:disabled,
    [part='trigger']:disabled,
    [part='item']:disabled {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }
  }
`;
