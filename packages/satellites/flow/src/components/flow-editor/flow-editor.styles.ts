import { css } from '@methane/core';

export const flowEditorStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.98 0.005 260), oklch(0.18 0.01 260)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.95 0.008 260), oklch(0.24 0.012 260)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.01 260), oklch(0.96 0.005 260)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 260), oklch(0.72 0.01 260)));
    --_border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_accent: var(--mth-color-accent, oklch(0.6 0.2 250));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_radius-sm: var(--mth-radius-sm, 0.375rem);
    --_pan-x: 0px;
    --_pan-y: 0px;
    --_zoom: 1;
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .tool-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    background-color: var(--_surface);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .tool-btn:focus-visible,
  .flow-node:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .canvas {
    position: relative;
    inline-size: 100%;
    min-block-size: 18rem;
    overflow: hidden;
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    background-color: var(--_bg);
  }

  .plane {
    position: relative;
    direction: ltr;
    inline-size: 100%;
    block-size: 18rem;
    transform-origin: 0 0;
    transform: translate3d(var(--_pan-x), var(--_pan-y), 0) scale(var(--_zoom));
  }

  .edges-svg {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .edge-path {
    fill: none;
    stroke: var(--_border);
    stroke-width: 2;
  }

  .edge-path[data-highlighted='true'] {
    stroke: var(--_accent);
  }

  .flow-node {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    transform: translate3d(var(--_node-x, 0px), var(--_node-y, 0px), 0);
    inline-size: var(--_node-w, 9rem);
    min-block-size: var(--_node-h, 3rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
    box-sizing: border-box;
  }

  .flow-node[aria-pressed='true'] {
    border-color: var(--_accent);
    box-shadow: 0 0 0 1px var(--_accent);
  }

  .port {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_accent);
    flex-shrink: 0;
  }

  .empty {
    padding-block: var(--mth-space-6, 1.5rem);
    text-align: center;
    color: var(--_fg-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  @media (forced-colors: active) {
    .flow-node[aria-pressed='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    .edge-path[data-highlighted='true'] {
      forced-color-adjust: none;
      stroke: Highlight;
    }
  }
`;
