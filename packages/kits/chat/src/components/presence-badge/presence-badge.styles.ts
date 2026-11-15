import { css } from 'lit';

export const presenceBadgeStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_pb-color: var(--mth-color-fg-subtle, light-dark(oklch(0.55 0.015 260), oklch(0.68 0.012 260)));
    --_pb-bg: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.24 0.01 260)));
    --_pb-fg: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    --_pb-border: var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
  }

  :host(:state(online)) {
    --_pb-color: var(--mth-color-success, oklch(0.62 0.18 145));
    --_pb-bg: var(--mth-color-success-subtle, light-dark(oklch(0.95 0.04 145), oklch(0.24 0.05 145)));
  }

  :host(:state(away)) {
    --_pb-color: var(--mth-color-warning, oklch(0.72 0.16 75));
    --_pb-bg: var(--mth-color-warning-subtle, light-dark(oklch(0.96 0.04 75), oklch(0.25 0.05 75)));
  }

  :host(:state(busy)) {
    --_pb-color: var(--mth-color-danger, oklch(0.58 0.22 25));
    --_pb-bg: var(--mth-color-danger-subtle, light-dark(oklch(0.95 0.04 25), oklch(0.24 0.05 25)));
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-px, 0.125rem);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_pb-bg);
    color: var(--_pb-fg);
    border: 1px solid var(--_pb-border);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  :host([size='sm']) .base {
    padding-inline: var(--mth-space-1, 0.25rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 0.75rem;
    block-size: 0.75rem;
    color: var(--_pb-color);
    flex-shrink: 0;
  }

  .indicator svg {
    inline-size: 100%;
    block-size: 100%;
    display: block;
  }

  @media (forced-colors: active) {
    .base {
      border-color: CanvasText;
      color: CanvasText;
      background-color: Canvas;
    }

    .indicator {
      forced-color-adjust: none;
      color: Highlight;
    }

    :host(:state(offline)) .indicator {
      color: GrayText;
    }
  }
`;
