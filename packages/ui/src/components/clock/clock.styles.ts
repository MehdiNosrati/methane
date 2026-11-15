import { css } from 'lit';

export const clockStyles = css`
  :host {
    display: inline-block;
    --_clk-bg: var(--mth-color-surface, oklch(1 0 0));
    --_clk-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_clk-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_clk-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_clk-accent: var(--mth-color-accent, oklch(0.54 0.2 255));
    color: var(--_clk-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_clk-border);
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--_clk-bg);
  }

  .dial {
    inline-size: 6rem;
    block-size: 6rem;
  }

  .face {
    fill: var(--_clk-bg);
    stroke: var(--_clk-border);
    stroke-width: 2;
  }

  .tick-mark {
    stroke: var(--_clk-muted);
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .hand-hour {
    stroke: var(--_clk-fg);
    stroke-width: 3.5;
    stroke-linecap: round;
  }

  .hand-minute {
    stroke: var(--_clk-fg);
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .hand-second {
    stroke: var(--_clk-accent);
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .pivot {
    fill: var(--_clk-fg);
  }

  .time {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    font-variant-numeric: tabular-nums;
  }

  @media (forced-colors: active) {
    .base {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    .face {
      fill: Canvas;
      stroke: ButtonBorder;
    }

    .hand-hour,
    .hand-minute,
    .pivot {
      stroke: CanvasText;
      fill: CanvasText;
    }

    .hand-second {
      stroke: Highlight;
    }
  }
`;
