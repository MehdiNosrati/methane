import { css } from 'lit';

export const networkStatusStyles = css`
  :host {
    --_bg: var(--mth-color-warning-subtle, oklch(95% 0.05 85));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_dot: var(--mth-color-warning, oklch(62% 0.17 85));
    --_border: var(--mth-color-border, oklch(85% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));

    display: block;
    color: var(--_fg);
  }

  :host([online]) {
    --_bg: var(--mth-color-success-subtle, oklch(95% 0.05 145));
    --_dot: var(--mth-color-success, oklch(50% 0.16 145));
  }

  .base {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--_bg);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .base[hidden] {
    display: none;
  }

  .leading {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .dot {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_dot);
    flex-shrink: 0;
  }

  .actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .retry-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg, oklch(100% 0 0));
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .retry-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .retry-btn {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
