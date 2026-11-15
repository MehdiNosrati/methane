import { css } from 'lit';

export const stopwatchStyles = css`
  :host {
    display: inline-block;
    --_sw-bg: var(--mth-color-surface, oklch(1 0 0));
    --_sw-subtle: var(--mth-color-bg-subtle, oklch(0.96 0.005 250));
    --_sw-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_sw-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_sw-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_sw-focus: var(--mth-color-border-focus, oklch(0.55 0.2 250));
    --_sw-accent: var(--mth-color-accent, oklch(0.54 0.2 255));
    --_sw-accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    color: var(--_sw-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--_sw-border);
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--_sw-bg);
  }

  .time {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-3xl, 1.875rem);
    font-weight: var(--mth-font-weight-bold, 700);
    line-height: var(--mth-line-height-tight, 1.25);
    font-variant-numeric: tabular-nums;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn {
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_sw-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--_sw-bg);
    color: var(--_sw-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .btn--primary {
    background-color: var(--_sw-accent);
    border-color: var(--_sw-accent);
    color: var(--_sw-accent-fg);
  }

  .btn:hover:not(:disabled):not(.btn--primary) {
    background-color: var(--_sw-subtle);
  }

  .btn:focus-visible {
    outline: 2px solid var(--_sw-focus);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .laps {
    inline-size: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    border-block-start: 1px solid var(--_sw-border);
    padding-block-start: var(--mth-space-2, 0.5rem);
  }

  .lap-item {
    display: flex;
    justify-content: space-between;
    gap: var(--mth-space-4, 1rem);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-variant-numeric: tabular-nums;
    color: var(--_sw-muted);
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
    .base,
    .btn {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: ButtonText;
    }

    .btn--primary {
      background-color: Highlight;
      color: HighlightText;
    }

    .btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
