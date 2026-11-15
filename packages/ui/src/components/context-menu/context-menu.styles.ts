import { css } from 'lit';

export const contextMenuStyles = css`
  :host {
    --_cm-surface: var(--mth-color-surface-raised, Canvas);
    --_cm-hover: var(--mth-color-bg-subtle, oklch(0.95 0.01 255));
    --_cm-fg: var(--mth-color-fg, CanvasText);
    --_cm-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_cm-border: var(--mth-color-border, ButtonBorder);
    --_cm-focus: var(--mth-color-border-focus, Highlight);
    --_cm-radius: var(--mth-radius-md, 0.375rem);
    --_cm-space-1: var(--mth-space-1, 0.25rem);
    --_cm-space-2: var(--mth-space-2, 0.5rem);
    --_cm-space-3: var(--mth-space-3, 0.75rem);
    --_cm-font: var(--mth-font-sans, system-ui, sans-serif);
    --_cm-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_cm-font-xs: var(--mth-font-size-xs, 0.75rem);
    --_cm-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.15 0.01 255 / 0.16));
    --_cm-z: var(--mth-z-index-popover, 500);

    display: block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--_cm-font);
    color: var(--_cm-fg);
  }

  [part='popup'] {
    z-index: var(--_cm-z);
    margin: 0;
    min-inline-size: 13rem;
    padding: var(--_cm-space-1);
    border: 1px solid var(--_cm-border);
    border-radius: var(--_cm-radius);
    background-color: var(--_cm-surface);
    box-shadow: var(--_cm-shadow);
    overflow: visible;
  }

  [part='popup'][hidden] {
    display: none;
  }

  [part='popup'][data-mth-top-layer-fallback] {
    position: fixed;
  }

  [part='menu'],
  [part='submenu'] {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cm-row {
    position: relative;
  }

  [part='submenu'] {
    position: absolute;
    inset-block-start: -2px;
    inset-inline-start: calc(100% + 4px);
    z-index: calc(var(--_cm-z) + 1);
    min-inline-size: 12rem;
    padding: var(--_cm-space-1);
    border: 1px solid var(--_cm-border);
    border-radius: var(--_cm-radius);
    background-color: var(--_cm-surface);
    box-shadow: var(--_cm-shadow);
  }

  [part='submenu'][hidden] {
    display: none;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_cm-space-3);
    inline-size: 100%;
    padding-block: var(--_cm-space-2);
    padding-inline: var(--_cm-space-2);
    border: none;
    border-radius: var(--_cm-radius);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--_cm-font-sm);
    text-align: start;
    cursor: pointer;
  }

  [part='item']:hover:not([aria-disabled='true']),
  [part='item'][aria-expanded='true'] {
    background-color: var(--_cm-hover);
  }

  [part='item'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='item']:focus-visible {
    outline: 2px solid var(--_cm-focus);
    outline-offset: -2px;
  }

  [part='shortcut'] {
    font-size: var(--_cm-font-xs);
    color: var(--_cm-fg-muted);
  }

  [part='separator'] {
    block-size: 1px;
    background-color: var(--_cm-border);
    margin-block: var(--_cm-space-1);
  }

  @media (forced-colors: active) {
    [part='popup'],
    [part='submenu'] {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    [part='item']:focus-visible {
      outline-color: Highlight;
    }
  }
`;
