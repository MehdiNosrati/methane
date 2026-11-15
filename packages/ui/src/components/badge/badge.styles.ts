import { css } from 'lit';

export const badgeStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_badge-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_badge-fg: var(--mth-color-fg, CanvasText);
    --_badge-border: var(--mth-color-border, ButtonBorder);
    --_badge-dot: var(--mth-color-fg-muted, GrayText);
    --_badge-radius: var(--mth-radius-sm, 0.25rem);
    --_badge-pad-block: calc(var(--mth-space-1, 0.25rem) * 0.5);
    --_badge-pad-inline: var(--mth-space-2, 0.5rem);
    --_badge-font-size: var(--mth-font-size-xs, 0.75rem);
    --_badge-dot-size: 0.5rem;
  }

  .base[data-variant='accent'] {
    --_badge-bg: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_badge-fg: var(--mth-color-accent, Highlight);
    --_badge-border: var(--mth-color-accent, Highlight);
    --_badge-dot: var(--mth-color-accent, Highlight);
  }

  .base[data-variant='success'] {
    --_badge-bg: var(--mth-color-success-subtle, oklch(0.96 0.03 150));
    --_badge-fg: var(--mth-color-success, oklch(0.45 0.17 150));
    --_badge-border: var(--mth-color-success, oklch(0.6 0.17 150));
    --_badge-dot: var(--mth-color-success, oklch(0.6 0.17 150));
  }

  .base[data-variant='warning'] {
    --_badge-bg: var(--mth-color-warning-subtle, oklch(0.96 0.04 75));
    --_badge-fg: var(--mth-color-warning, oklch(0.5 0.17 75));
    --_badge-border: var(--mth-color-warning, oklch(0.7 0.17 75));
    --_badge-dot: var(--mth-color-warning, oklch(0.7 0.17 75));
  }

  .base[data-variant='danger'] {
    --_badge-bg: var(--mth-color-danger-subtle, oklch(0.96 0.04 25));
    --_badge-fg: var(--mth-color-danger, oklch(0.5 0.22 25));
    --_badge-border: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_badge-dot: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .base[data-size='sm'] {
    --_badge-pad-block: 0.0625rem;
    --_badge-pad-inline: var(--mth-space-1, 0.25rem);
    --_badge-font-size: 0.6875rem;
    --_badge-dot-size: 0.375rem;
  }

  .base[data-size='lg'] {
    --_badge-pad-block: var(--mth-space-1, 0.25rem);
    --_badge-pad-inline: var(--mth-space-3, 0.75rem);
    --_badge-font-size: var(--mth-font-size-sm, 0.875rem);
    --_badge-dot-size: 0.625rem;
  }

  .base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-block: var(--_badge-pad-block);
    padding-inline: var(--_badge-pad-inline);
    border: 1px solid var(--_badge-border);
    border-radius: var(--_badge-radius);
    background-color: var(--_badge-bg);
    color: var(--_badge-fg);
    font-size: var(--_badge-font-size);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    white-space: nowrap;
  }

  .base[data-pill='true'] {
    border-radius: var(--mth-radius-full, 9999px);
  }

  .base[data-dot='true'] {
    padding-block: 0;
    padding-inline: 0;
    inline-size: var(--_badge-dot-size);
    block-size: var(--_badge-dot-size);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_badge-dot);
    border-color: transparent;
  }

  .dot-indicator {
    display: none;
  }

  .label[hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid ButtonBorder;
    }

    .base[data-dot='true'] {
      background-color: Highlight;
      border-color: Highlight;
    }
  }
`;
