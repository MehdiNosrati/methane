import { css } from 'lit';

export const menuItemStyles = css`
  :host {
    display: block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    cursor: pointer;
    user-select: none;
    outline: none;
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .base {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-control-block, 0.4375rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: transparent;
  }

  :host(:focus-visible) .base,
  :host(:state(active)) .base,
  :host([active]) .base,
  :host([data-active='true']) .base {
    background-color: var(--mth-color-bg-subtle, oklch(0.95 0.01 255));
  }

  :host(:focus-visible) .base {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: -2px;
  }

  .check {
    inline-size: 1rem;
    flex-shrink: 0;
    text-align: center;
    color: var(--mth-color-accent, Highlight);
  }

  .label {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .shortcut {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, GrayText);
    margin-inline-start: var(--mth-space-4, 1rem);
  }

  .submenu-arrow {
    margin-inline-start: var(--mth-space-2, 0.5rem);
    color: var(--mth-color-fg-muted, GrayText);
  }

  .submenu-arrow[hidden],
  .submenu[hidden] {
    display: none;
  }

  .submenu {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 100%;
    z-index: var(--mth-z-index-popover, 500);
    min-inline-size: 11rem;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--mth-color-border, ButtonBorder);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface-raised, Canvas);
    box-shadow: var(--mth-shadow-lg, 0 12px 24px oklch(0 0 0 / 0.16));
  }

  @media (forced-colors: active) {
    :host(:state(disabled)) .base,
    :host([disabled]) .base {
      color: GrayText;
    }

    :host(:focus-visible) .base,
    :host(:state(active)) .base,
    :host([active]) .base {
      background-color: Highlight;
      color: HighlightText;
      outline: 1px solid Highlight;
    }

    .check,
    .shortcut,
    .submenu-arrow {
      color: inherit;
    }

    .submenu {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }
  }
`;
