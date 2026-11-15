import { css } from 'lit';

export const comboboxStyles = css`
  :host {
    display: block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, CanvasText);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  [part='label'] {
    display: block;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    margin-block-end: var(--mth-space-1, 0.25rem);
    color: var(--mth-color-fg, CanvasText);
  }

  [part='control'] {
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    min-block-size: 2.5rem;
    border: 1px solid var(--mth-color-border, ButtonBorder);
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--mth-color-surface, Canvas);
  }

  :host(:focus-within) [part='control'] {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 1px;
  }

  :host(:state(invalid)) [part='control'],
  :host(:state(user-invalid)) [part='control'] {
    border-color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  [part='input'] {
    flex: 1 1 auto;
    min-inline-size: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
    padding-block: var(--mth-space-control-block, 0.5rem);
  }

  [part='clear-button'],
  [part='toggle-button'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--mth-color-fg-muted, GrayText);
    cursor: pointer;
    padding: var(--mth-space-1, 0.25rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    font: inherit;
  }

  [part='popup'] {
    z-index: var(--mth-z-index-popover, 500);
    min-inline-size: 12rem;
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--mth-color-border, ButtonBorder);
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--mth-color-surface-raised, Canvas);
    box-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.15 0.01 255 / 0.16));
  }

  [part='popup'][hidden] {
    display: none;
  }

  [part='listbox'] {
    max-block-size: var(--mth-combobox-max-height, 16rem);
    overflow-block: auto;
    outline: none;
  }

  [part='group-label'] {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg-muted, GrayText);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
  }

  [part='option'] {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    cursor: pointer;
  }

  [part='option'][data-active='true'] {
    background-color: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
  }

  [part='option'][aria-selected='true'] {
    font-weight: var(--mth-font-weight-semibold, 600);
    background-color: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
  }

  [part='option'][aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='status'],
  [part='empty'] {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, GrayText);
  }

  [part='hint'],
  [part='error'] {
    margin-block-start: var(--mth-space-1, 0.25rem);
    margin-block-end: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  [part='hint'] {
    color: var(--mth-color-fg-muted, GrayText);
  }

  [part='error'] {
    color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  [part='hint'][hidden],
  [part='error'][hidden] {
    display: none;
  }

  .mth-slot-collector {
    display: none;
  }

  @media (forced-colors: active) {
    [part='control'],
    [part='popup'] {
      border: 1px solid ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    :host(:focus-within) [part='control'] {
      outline: 2px solid Highlight;
    }

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      border-color: GrayText;
      color: GrayText;
    }

    [part='option'][data-active='true'],
    [part='option'][aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
      outline: 1px solid Highlight;
    }

    [part='option'][aria-disabled='true'] {
      color: GrayText;
    }
  }
`;
