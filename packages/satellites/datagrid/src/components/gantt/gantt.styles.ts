import { css } from 'lit';

export const ganttStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_gt-bg: var(--mth-color-surface, Canvas);
    --_gt-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_gt-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_gt-focus: var(--mth-color-border-focus, light-dark(oklch(0.6 0.2 250), oklch(0.7 0.18 250)));
    --_gt-accent: var(--mth-color-accent, light-dark(oklch(0.55 0.2 250), oklch(0.68 0.18 250)));
    --_gt-accent-fg: var(--mth-color-accent-fg, light-dark(oklch(0.99 0.005 250), oklch(0.15 0.02 250)));
    --_gt-success: var(--mth-color-success, light-dark(oklch(0.6 0.16 145), oklch(0.72 0.15 145)));
    --_gt-warning: var(--mth-color-warning, light-dark(oklch(0.75 0.16 75), oklch(0.8 0.15 75)));
    --_gt-muted: var(--mth-color-fg-muted, GrayText);
    --_gt-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_gt-bg);
    border: 1px solid var(--_gt-border);
    border-radius: var(--_gt-radius);
    overflow: hidden;
  }

  .viewport {
    position: relative;
    overflow: auto;
    max-block-size: 24rem;
    inline-size: 100%;
  }

  .grid {
    position: relative;
    display: grid;
    inline-size: 100%;
  }

  .dependencies-layer {
    position: absolute;
    inset-block-start: var(--_gt-row-height, 2.5rem);
    inset-inline-start: 11rem;
    inline-size: calc(100% - 11rem);
    pointer-events: none;
    overflow: visible;
    z-index: 1;
  }

  .dependencies-layer[data-dir='rtl'] {
    transform: scaleX(-1);
  }

  .dependency-path {
    fill: none;
    stroke: var(--_gt-accent);
    stroke-width: 1.5;
  }

  .row {
    display: flex;
    align-items: center;
    min-block-size: var(--_gt-row-height, 2.5rem);
    border-block-end: 1px solid var(--_gt-border);
  }

  .row:focus-visible {
    outline: 2px solid var(--_gt-focus);
    outline-offset: -2px;
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_gt-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .task-cell {
    box-sizing: border-box;
    flex: 0 0 11rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--_gt-border);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline-track {
    position: relative;
    flex: 1 1 auto;
    block-size: var(--_gt-row-height, 2.5rem);
    display: flex;
    align-items: center;
  }

  .day-header {
    box-sizing: border-box;
    flex: 1 1 0;
    min-inline-size: 2.5rem;
    padding-inline: var(--mth-space-1, 0.25rem);
    border-inline-end: 1px solid var(--_gt-border);
    text-align: center;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .task-bar {
    position: absolute;
    block-size: 1.5rem;
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_gt-accent);
    color: var(--_gt-accent-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .task-progress {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    background: var(--_gt-success);
    opacity: 0.35;
    pointer-events: none;
  }

  .task-bar[data-milestone='true'] {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    padding: 0;
    justify-content: center;
    background: var(--_gt-warning);
    transform: rotate(45deg);
  }

  .task-bar:focus-visible {
    outline: 2px solid var(--_gt-focus);
    outline-offset: 2px;
  }

  .status {
    padding: var(--mth-space-4, 1rem);
    color: var(--_gt-muted);
    text-align: center;
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .task-cell,
    .day-header {
      border-color: ButtonBorder;
    }

    .task-bar {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
      border-color: HighlightText;
    }

    .dependency-path {
      stroke: Highlight;
    }

    .row:focus-visible,
    .task-bar:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
