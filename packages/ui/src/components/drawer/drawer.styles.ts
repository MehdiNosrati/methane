import { css } from 'lit';

export const drawerStyles = css`
  :host {
    display: contents;
    --_drawer-bg: var(--mth-color-surface-raised, Canvas);
    --_drawer-fg: var(--mth-color-fg, CanvasText);
    --_drawer-muted: var(--mth-color-fg-muted, GrayText);
    --_drawer-border: var(--mth-color-border, ButtonBorder);
    --_drawer-backdrop: var(--mth-color-backdrop, oklch(0 0 0 / 0.45));
    --_drawer-shadow: var(--mth-shadow-lg, 0 12px 32px oklch(0 0 0 / 0.2));
    --_drawer-pad: calc(var(--mth-space-5, 1.25rem) * var(--mth-density, 1));
    --_drawer-inline-size: var(--mth-drawer-size, 24rem);
    --_drawer-block-size: var(--mth-drawer-size, 20rem);
  }

  :host([size='sm']) {
    --_drawer-inline-size: var(--mth-drawer-size, 18rem);
    --_drawer-block-size: var(--mth-drawer-size, 14rem);
  }

  :host([size='md']) {
    --_drawer-inline-size: var(--mth-drawer-size, 24rem);
    --_drawer-block-size: var(--mth-drawer-size, 20rem);
  }

  :host([size='lg']) {
    --_drawer-inline-size: var(--mth-drawer-size, 36rem);
    --_drawer-block-size: var(--mth-drawer-size, 28rem);
  }

  :host([size='full']) {
    --_drawer-inline-size: 100vi;
    --_drawer-block-size: 100vb;
  }

  dialog.base {
    border: none;
    margin-block: 0;
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0;
    background: transparent;
    color: var(--_drawer-fg);
    inline-size: 100vi;
    block-size: 100vb;
    max-inline-size: 100vi;
    max-block-size: 100vb;
    overflow: hidden;
  }

  dialog.base:not([open]):not([data-mth-open='true']) {
    display: none;
  }

  dialog.base::backdrop {
    background: var(--_drawer-backdrop);
  }

  dialog.base[data-mth-top-layer-fallback][data-mth-open='true'] {
    position: fixed;
    inset-block: 0;
    inset-inline: 0;
    z-index: var(--mth-z-index-modal, 400);
    display: block;
    background: var(--_drawer-backdrop);
  }

  .popup {
    position: fixed;
    inset-block: 0;
    inset-inline-end: 0;
    inline-size: min(var(--_drawer-inline-size), 100vi);
    block-size: 100vb;
    background: var(--_drawer-bg);
    color: var(--_drawer-fg);
    border-inline-start: 1px solid var(--_drawer-border);
    box-shadow: var(--_drawer-shadow);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  }

  :host([placement='start']) .popup {
    inset-inline-end: auto;
    inset-inline-start: 0;
    border-inline-start: none;
    border-inline-end: 1px solid var(--_drawer-border);
  }

  :host([placement='top']) .popup {
    inset-inline: 0;
    inset-block-end: auto;
    inset-block-start: 0;
    inline-size: 100vi;
    block-size: min(var(--_drawer-block-size), 100vb);
    border-inline-start: none;
    border-block-end: 1px solid var(--_drawer-border);
  }

  :host([placement='bottom']) .popup {
    inset-inline: 0;
    inset-block-start: auto;
    inset-block-end: 0;
    inline-size: 100vi;
    block-size: min(var(--_drawer-block-size), 100vb);
    border-inline-start: none;
    border-block-start: 1px solid var(--_drawer-border);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--_drawer-pad);
    padding-inline: var(--_drawer-pad);
    border-block-end: 1px solid var(--_drawer-border);
  }

  .title {
    margin-block: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2rem;
    block-size: 2rem;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_drawer-muted);
    cursor: pointer;
    padding-block: 0;
    padding-inline: 0;
    font: inherit;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .close-btn:hover {
    background: var(--mth-color-bg-muted, light-dark(oklch(0.925 0.01 262), oklch(0.24 0.016 262)));
    color: var(--_drawer-fg);
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  .body {
    flex: 1 1 auto;
    padding-block: var(--_drawer-pad);
    padding-inline: var(--_drawer-pad);
    overflow-block: auto;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--_drawer-pad);
    padding-inline: var(--_drawer-pad);
    border-block-start: 1px solid var(--_drawer-border);
  }

  .footer[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .close-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .popup {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }

    .close-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
