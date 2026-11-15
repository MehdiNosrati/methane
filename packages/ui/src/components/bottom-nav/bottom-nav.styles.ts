import { css } from 'lit';

export const bottomNavStyles = css`
  :host {
    display: block;
    --_bn-surface: var(--mth-color-surface, oklch(1 0 0));
    --_bn-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_bn-muted: var(--mth-color-fg-muted, oklch(0.5 0.02 260));
    --_bn-border: var(--mth-color-border, oklch(0.86 0.01 260));
    --_bn-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_bn-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    --_bn-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_bn-z: var(--mth-z-index-sticky, 200);
  }

  :host([fixed]) {
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: var(--_bn-z);
  }

  [part='nav'] {
    background: var(--_bn-surface);
    border-block-start: 1px solid var(--_bn-border);
    padding-block-end: env(safe-area-inset-bottom, 0px);
  }

  [part='list'] {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: stretch;
    justify-content: space-around;
  }

  [part='list'] > li {
    flex: 1 1 0;
    display: flex;
  }

  [part='item'] {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-block-size: 3rem;
    padding-inline: 0.5rem;
    border: none;
    background: transparent;
    color: var(--_bn-muted);
    font: inherit;
    font-size: var(--_bn-font-sm);
    text-decoration: none;
    cursor: pointer;
  }

  [part='item'][aria-current='page'] {
    color: var(--_bn-primary);
    font-weight: 600;
  }

  [part='item'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='item']:focus-visible {
    outline: 2px solid var(--_bn-primary);
    outline-offset: -2px;
  }

  [part='badge'] {
    font-size: 0.75rem;
    font-weight: 600;
    padding-inline: 0.375rem;
    border-radius: 9999px;
    background: var(--_bn-danger);
    color: oklch(1 0 0);
  }

  @media (forced-colors: active) {
    [part='nav'] {
      background: Canvas;
      border-block-start-color: CanvasText;
    }

    [part='item'][aria-current='page'] {
      color: Highlight;
      forced-color-adjust: none;
    }
  }
`;
