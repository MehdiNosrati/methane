import { css } from 'lit';

export const megaMenuStyles = css`
  :host {
    --_mm-bg: var(--mth-color-surface, Canvas);
    --_mm-panel-bg: var(--mth-color-surface-raised, Canvas);
    --_mm-hover: var(--mth-color-bg-subtle, oklch(0.95 0.01 255));
    --_mm-fg: var(--mth-color-fg, CanvasText);
    --_mm-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_mm-border: var(--mth-color-border, ButtonBorder);
    --_mm-focus: var(--mth-color-border-focus, Highlight);
    --_mm-radius: var(--mth-radius-md, 0.375rem);
    --_mm-space-1: var(--mth-space-1, 0.25rem);
    --_mm-space-2: var(--mth-space-2, 0.5rem);
    --_mm-space-3: var(--mth-space-3, 0.75rem);
    --_mm-space-4: var(--mth-space-4, 1rem);
    --_mm-font: var(--mth-font-sans, system-ui, sans-serif);
    --_mm-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_mm-font-xs: var(--mth-font-size-xs, 0.75rem);
    --_mm-weight-semibold: var(--mth-font-weight-semibold, 600);
    --_mm-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.15 0.01 255 / 0.16));
    --_mm-z: var(--mth-z-index-popover, 500);

    display: block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--_mm-font);
    color: var(--_mm-fg);
  }

  [part='nav'] {
    display: flex;
    align-items: center;
    gap: var(--_mm-space-3);
    background-color: var(--_mm-bg);
    border-block-end: 1px solid var(--_mm-border);
    padding-block: var(--_mm-space-2);
    padding-inline: var(--_mm-space-4);
  }

  [part='triggers'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--_mm-space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    gap: var(--_mm-space-1);
    padding-block: var(--_mm-space-2);
    padding-inline: var(--_mm-space-3);
    border: none;
    border-radius: var(--_mm-radius);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--_mm-font-sm);
    font-weight: var(--_mm-weight-semibold);
    cursor: pointer;
    text-decoration: none;
  }

  [part='trigger']:hover:not([aria-disabled='true']),
  [part='trigger'][aria-expanded='true'] {
    background-color: var(--_mm-hover);
  }

  [part='trigger']:focus-visible,
  [part='link']:focus-visible {
    outline: 2px solid var(--_mm-focus);
    outline-offset: 2px;
  }

  [part='panel'] {
    z-index: var(--_mm-z);
    margin: 0;
    min-inline-size: min(44rem, 92vw);
    padding: var(--_mm-space-4);
    border: 1px solid var(--_mm-border);
    border-radius: var(--_mm-radius);
    background-color: var(--_mm-panel-bg);
    box-shadow: var(--_mm-shadow);
  }

  [part='panel'][hidden] {
    display: none;
  }

  [part='panel'][data-mth-top-layer-fallback] {
    position: fixed;
  }

  [part='columns'] {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--_mm-space-4);
  }

  [part='column-title'] {
    margin: 0 0 var(--_mm-space-2);
    font-size: var(--_mm-font-xs);
    font-weight: var(--_mm-weight-semibold);
    color: var(--_mm-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .mm-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--_mm-space-1);
  }

  [part='link'] {
    display: block;
    padding: var(--_mm-space-2);
    border-radius: var(--_mm-radius);
    color: inherit;
    text-decoration: none;
    font-size: var(--_mm-font-sm);
    font-weight: var(--_mm-weight-semibold);
  }

  [part='link']:hover {
    background-color: var(--_mm-hover);
  }

  [part='description'] {
    display: block;
    margin-block-start: 2px;
    font-size: var(--_mm-font-xs);
    font-weight: normal;
    color: var(--_mm-fg-muted);
  }

  @media (forced-colors: active) {
    [part='nav'],
    [part='panel'] {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    [part='trigger']:focus-visible,
    [part='link']:focus-visible {
      outline-color: Highlight;
    }
  }
`;
