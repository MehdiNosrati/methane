import { css } from 'lit';

export const countdownStyles = css`
  :host {
    display: inline-block;
    --_cd-bg: var(--mth-color-surface, oklch(1 0 0));
    --_cd-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_cd-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_cd-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_cd-radius: var(--mth-radius-md, 0.5rem);
    color: var(--_cd-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .time {
    display: inline-flex;
    align-items: stretch;
    gap: var(--mth-space-2, 0.5rem);
  }

  .segment {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--mth-space-12, 3rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_cd-border);
    border-radius: var(--_cd-radius);
    background-color: var(--_cd-bg);
  }

  .value {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-2xl, 1.5rem);
    font-weight: var(--mth-font-weight-bold, 700);
    line-height: var(--mth-line-height-tight, 1.25);
    font-variant-numeric: tabular-nums;
  }

  .unit {
    color: var(--_cd-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (forced-colors: active) {
    .segment {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    .unit {
      color: GrayText;
    }
  }
`;
