import { css } from 'lit';

export const alertStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_alert-bg: var(--mth-color-info-subtle, oklch(0.96 0.03 230));
    --_alert-fg: var(--mth-color-fg, CanvasText);
    --_alert-muted: var(--mth-color-fg-muted, GrayText);
    --_alert-accent: var(--mth-color-info, oklch(0.62 0.16 230));
    --_alert-border: var(--mth-color-border, ButtonBorder);
    --_alert-radius: var(--mth-radius-md, 0.5rem);
    --_alert-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_alert-pad-block: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
    --_alert-pad-inline: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
    --_alert-gap: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
  }

  :host([hidden]),
  .base[hidden] {
    display: none;
  }

  .base[data-variant='success'] {
    --_alert-bg: var(--mth-color-success-subtle, oklch(0.96 0.03 150));
    --_alert-accent: var(--mth-color-success, oklch(0.6 0.17 150));
  }

  .base[data-variant='warning'] {
    --_alert-bg: var(--mth-color-warning-subtle, oklch(0.96 0.04 75));
    --_alert-accent: var(--mth-color-warning, oklch(0.65 0.17 75));
  }

  .base[data-variant='danger'] {
    --_alert-bg: var(--mth-color-danger-subtle, oklch(0.96 0.04 25));
    --_alert-accent: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .base {
    display: flex;
    align-items: flex-start;
    gap: var(--_alert-gap);
    padding-block: var(--_alert-pad-block);
    padding-inline: var(--_alert-pad-inline);
    border: 1px solid var(--_alert-border);
    border-inline-start: 4px solid var(--_alert-accent);
    border-radius: var(--_alert-radius);
    background-color: var(--_alert-bg);
    color: var(--_alert-fg);
    box-shadow: var(--_alert-shadow);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--_alert-accent);
    margin-block-start: 0.125rem;
  }

  .icon-svg {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .content {
    flex: 1 1 auto;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .title[hidden] {
    display: none;
  }

  .message {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--_alert-fg);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
  }

  .actions[hidden] {
    display: none;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_alert-muted);
    cursor: pointer;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    font: inherit;
    line-height: 1;
  }

  .close-btn:hover {
    color: var(--_alert-fg);
    background-color: var(--mth-color-bg-subtle, oklch(0.92 0.01 255 / 0.5));
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid ButtonBorder;
      border-inline-start: 4px solid Highlight;
    }

    .icon {
      color: Highlight;
    }

    .close-btn {
      color: ButtonText;
      border-color: ButtonBorder;
    }

    .close-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
