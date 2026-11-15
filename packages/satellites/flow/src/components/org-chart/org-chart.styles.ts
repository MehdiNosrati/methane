import { css } from '@methane/core';

export const orgChartStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.98 0.005 260), oklch(0.18 0.01 260)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.95 0.008 260), oklch(0.24 0.012 260)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.01 260), oklch(0.96 0.005 260)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 260), oklch(0.72 0.01 260)));
    --_border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_accent: var(--mth-color-accent, oklch(0.6 0.2 250));
    --_accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.28 0.06 250)));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_radius-sm: var(--mth-radius-sm, 0.375rem);
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .search-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  .search-input {
    flex: 1 1 auto;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    background-color: var(--_surface);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .search-input:focus-visible,
  .card-btn:focus-visible,
  .toggle-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .canvas {
    position: relative;
    direction: ltr;
    inline-size: 100%;
    min-block-size: var(--_chart-h, 18rem);
    overflow: auto;
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
  }

  .edges-svg {
    position: absolute;
    inset: 0;
    inline-size: var(--_chart-w, 100%);
    block-size: var(--_chart-h, 18rem);
    pointer-events: none;
  }

  .connector {
    fill: none;
    stroke: var(--_border);
    stroke-width: 2;
  }

  .card {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    transform: translate3d(var(--_card-x, 0px), var(--_card-y, 0px), 0);
    inline-size: 11rem;
    min-block-size: 4.25rem;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    box-sizing: border-box;
  }

  .card[data-selected='true'] {
    border-color: var(--_accent);
  }

  .card[data-match='true'] {
    background-color: var(--_accent-subtle);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-1, 0.25rem);
  }

  .card-btn {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    text-align: start;
    cursor: pointer;
  }

  .toggle-btn {
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_bg);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    cursor: pointer;
  }

  .card-meta {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  .empty {
    padding-block: var(--mth-space-6, 1.5rem);
    text-align: center;
    color: var(--_fg-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  @media (forced-colors: active) {
    .card[data-selected='true'] {
      forced-color-adjust: none;
      border: 2px solid Highlight;
    }

    .card-btn[aria-pressed='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
