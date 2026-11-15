import { css } from 'lit';

export const dropdownMenuStyles = css`
  :host {
    display: inline-block;
    position: relative;
    --_menu-bg: var(--mth-color-surface-raised, Canvas);
    --_menu-fg: var(--mth-color-fg, CanvasText);
    --_menu-border: var(--mth-color-border, ButtonBorder);
    --_menu-radius: var(--mth-radius-md, 0.5rem);
    --_menu-shadow: var(--mth-shadow-lg, 0 12px 28px oklch(0 0 0 / 0.18));
  }

  .anchor {
    display: inline-flex;
    align-items: center;
  }

  .surface {
    position: fixed;
    margin-block: 0;
    margin-inline: 0;
    z-index: var(--mth-z-index-popover, 500);
    min-inline-size: 12rem;
    max-inline-size: min(22rem, calc(100vi - 1rem));
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--_menu-border);
    border-radius: var(--_menu-radius);
    background: var(--_menu-bg);
    color: var(--_menu-fg);
    box-shadow: var(--_menu-shadow);
    box-sizing: border-box;
  }

  .surface[hidden],
  .surface:not([data-mth-open='true']) {
    display: none;
  }

  .menu-list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.125rem);
    max-block-size: min(20rem, calc(100vb - 2rem));
    overflow-block: auto;
    outline: none;
  }

  @media (forced-colors: active) {
    .surface {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }
  }
`;
