import { css } from 'lit';

export const sparklineStyles = css`
  :host {
    display: inline-block;
    inline-size: 100%;
    max-inline-size: 14rem;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_spark-stroke: var(--mth-color-accent, Highlight);
    --_spark-fill: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_spark-muted: var(--mth-color-fg-muted, GrayText);
    --_spark-block-size: 3rem;
  }

  .base[data-variant='success'] {
    --_spark-stroke: var(--mth-color-success, oklch(0.55 0.17 150));
    --_spark-fill: var(--mth-color-success-subtle, oklch(0.96 0.03 150));
  }

  .base[data-variant='warning'] {
    --_spark-stroke: var(--mth-color-warning, oklch(0.65 0.17 75));
    --_spark-fill: var(--mth-color-warning-subtle, oklch(0.96 0.04 75));
  }

  .base[data-variant='danger'] {
    --_spark-stroke: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_spark-fill: var(--mth-color-danger-subtle, oklch(0.96 0.04 25));
  }

  .base[data-variant='neutral'] {
    --_spark-stroke: var(--mth-color-fg-muted, GrayText);
    --_spark-fill: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .svg {
    display: block;
    inline-size: 100%;
    block-size: var(--_spark-block-size);
    overflow: visible;
  }

  .area {
    fill: var(--_spark-fill);
    stroke: none;
  }

  .line {
    fill: none;
    stroke: var(--_spark-stroke);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .bar {
    fill: var(--_spark-stroke);
    opacity: 0.85;
  }

  .point {
    fill: var(--mth-color-surface, Canvas);
    stroke: var(--_spark-stroke);
    stroke-width: 1.75;
    vector-effect: non-scaling-stroke;
  }

  .summary {
    color: var(--_spark-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    .line,
    .point {
      stroke: Highlight;
    }

    .bar {
      fill: Highlight;
    }

    .area {
      fill: Canvas;
    }
  }
`;
