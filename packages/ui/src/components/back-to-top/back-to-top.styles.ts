import { css } from 'lit';

export const backToTopStyles = css`
  :host {
    display: inline-block;
    position: fixed;
    inset-block-end: 1.5rem;
    inset-inline-end: 1.5rem;
    z-index: var(--_btt-z);
    --_btt-surface: var(--mth-color-surface, oklch(1 0 0));
    --_btt-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_btt-border: var(--mth-color-border, oklch(0.84 0.01 260));
    --_btt-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_btt-radius: var(--mth-radius-full, 9999px);
    --_btt-shadow: var(--mth-shadow-md, 0 8px 20px oklch(0.15 0.02 260 / 0.14));
    --_btt-z: var(--mth-z-index-sticky, 200);
  }

  [part='button'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding-inline: 0.875rem;
    padding-block: 0.625rem;
    border: 1px solid var(--_btt-border);
    border-radius: var(--_btt-radius);
    background: var(--_btt-surface);
    color: var(--_btt-text);
    box-shadow: var(--_btt-shadow);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
  }

  [part='button'][hidden] {
    display: none;
  }

  [part='button']:focus-visible {
    outline: 2px solid var(--_btt-primary);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    [part='button'] {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }
  }
`;
