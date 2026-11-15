import { css } from 'lit';

export const statCardStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_stat-bg: var(--mth-color-surface, Canvas);
    --_stat-fg: var(--mth-color-fg, CanvasText);
    --_stat-muted: var(--mth-color-fg-muted, GrayText);
    --_stat-border: var(--mth-color-border, ButtonBorder);
    --_stat-radius: var(--mth-radius-lg, 0.5rem);
    --_stat-pad: var(--mth-space-4, 1rem);
    --_stat-shadow: var(--mth-shadow-sm, none);
    --_stat-trend-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_stat-trend-fg: var(--mth-color-fg-muted, GrayText);
  }

  .base[data-variant='outlined'] {
    --_stat-shadow: none;
  }

  .base[data-variant='subtle'] {
    --_stat-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_stat-border: transparent;
    --_stat-shadow: none;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--_stat-pad);
    padding-inline: var(--_stat-pad);
    background-color: var(--_stat-bg);
    color: var(--_stat-fg);
    border: 1px solid var(--_stat-border);
    border-radius: var(--_stat-radius);
    box-shadow: var(--_stat-shadow);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    color: var(--_stat-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .icon {
    color: var(--_stat-muted);
    display: inline-flex;
    align-items: center;
  }

  .main-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .value {
    font-size: var(--mth-font-size-2xl, 1.5rem);
    font-weight: var(--mth-font-weight-bold, 700);
    line-height: var(--mth-line-height-tight, 1.25);
    font-variant-numeric: tabular-nums;
  }

  .trend {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_stat-trend-bg);
    color: var(--_stat-trend-fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .trend[data-trend='up'] {
    --_stat-trend-bg: var(--mth-color-success-subtle, oklch(0.96 0.03 150));
    --_stat-trend-fg: var(--mth-color-success, oklch(0.45 0.17 150));
  }

  .trend[data-trend='down'] {
    --_stat-trend-bg: var(--mth-color-danger-subtle, oklch(0.96 0.04 25));
    --_stat-trend-fg: var(--mth-color-danger, oklch(0.5 0.22 25));
  }

  .trend-icon {
    inline-size: 0.875em;
    block-size: 0.875em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .hint {
    color: var(--_stat-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .footer {
    border-block-start: 1px solid var(--mth-color-border, ButtonBorder);
    padding-block-start: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border-color: ButtonBorder;
      box-shadow: none;
    }

    .trend {
      border: 1px solid ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }
  }
`;
