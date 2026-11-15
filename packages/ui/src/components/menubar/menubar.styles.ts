import { css } from 'lit';

export const menubarStyles = css`
  :host {
    --_mb-bg: var(--mth-color-surface, Canvas);
    --_mb-surface-raised: var(--mth-color-surface-raised, Canvas);
    --_mb-hover: var(--mth-color-bg-subtle, oklch(0.95 0.01 255));
    --_mb-fg: var(--mth-color-fg, CanvasText);
    --_mb-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_mb-border: var(--mth-color-border, ButtonBorder);
    --_mb-focus: var(--mth-color-border-focus, Highlight);
    --_mb-radius: var(--mth-radius-md, 0.375rem);
    --_mb-space-1: var(--mth-space-1, 0.25rem);
    --_mb-space-2: var(--mth-space-2, 0.5rem);
    --_mb-space-3: var(--mth-space-3, 0.75rem);
    --_mb-font: var(--mth-font-sans, system-ui, sans-serif);
    --_mb-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_mb-font-xs: var(--mth-font-size-xs, 0.75rem);
    --_mb-weight-medium: var(--mth-font-weight-medium, 500);
    --_mb-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.15 0.01 255 / 0.16));
    --_mb-z: var(--mth-z-index-popover, 500);

    display: block;
    box-sizing: border-box;
    font-family: var(--_mb-font);
    color: var(--_mb-fg);
  }

  [part='menubar'] {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--_mb-space-1);
    padding: var(--_mb-space-1);
    background-color: var(--_mb-bg);
    border: 1px solid var(--_mb-border);
    border-radius: var(--_mb-radius);
  }

  :host([orientation='vertical']) [part='menubar'] {
    flex-direction: column;
    align-items: stretch;
  }

  .mb-entry {
    position: relative;
  }

  [part='item'] {
    display: inline-flex;
    align-items: center;
    gap: var(--_mb-space-1);
    padding-block: var(--_mb-space-1);
    padding-inline: var(--_mb-space-3);
    border: none;
    border-radius: var(--_mb-radius);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--_mb-font-sm);
    font-weight: var(--_mb-weight-medium);
    cursor: pointer;
    text-decoration: none;
  }

  [part='item']:hover:not([aria-disabled='true']),
  [part='item'][aria-expanded='true'] {
    background-color: var(--_mb-hover);
  }

  [part='item'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='item']:focus-visible,
  [part='submenu-item']:focus-visible {
    outline: 2px solid var(--_mb-focus);
    outline-offset: -2px;
  }

  [part='menu'] {
    position: absolute;
    inset-block-start: calc(100% + 4px);
    inset-inline-start: 0;
    z-index: var(--_mb-z);
    min-inline-size: 12rem;
    padding: var(--_mb-space-1);
    border: 1px solid var(--_mb-border);
    border-radius: var(--_mb-radius);
    background-color: var(--_mb-surface-raised);
    box-shadow: var(--_mb-shadow);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  [part='menu'][hidden] {
    display: none;
  }

  [part='submenu-item'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_mb-space-3);
    inline-size: 100%;
    padding-block: var(--_mb-space-2);
    padding-inline: var(--_mb-space-2);
    border: none;
    border-radius: var(--_mb-radius);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--_mb-font-sm);
    text-align: start;
    text-decoration: none;
    cursor: pointer;
  }

  [part='submenu-item']:hover:not([aria-disabled='true']) {
    background-color: var(--_mb-hover);
  }

  [part='submenu-item'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='shortcut'] {
    font-size: var(--_mb-font-xs);
    color: var(--_mb-fg-muted);
  }

  @media (forced-colors: active) {
    [part='menubar'],
    [part='menu'] {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    [part='item']:focus-visible,
    [part='submenu-item']:focus-visible {
      outline-color: Highlight;
    }
  }
`;
