import { css } from 'lit';

export const chartStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_chart-min-height: 20rem;
  }

  :host([size='sm']) {
    --_chart-min-height: 12rem;
  }

  :host([size='md']) {
    --_chart-min-height: 20rem;
  }

  :host([size='lg']) {
    --_chart-min-height: 28rem;
  }

  :host([size='full']) {
    --_chart-min-height: 100%;
    block-size: 100%;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    inline-size: 100%;
    block-size: 100%;
    box-sizing: border-box;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    flex-wrap: wrap;
  }

  .headings {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    min-inline-size: 0;
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: 1.3;
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
  }

  .subtitle {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
  }

  .toggle {
    appearance: none;
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .toggle:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: 2px;
  }

  .viewport {
    position: relative;
    inline-size: 100%;
    min-block-size: var(--_chart-height, var(--_chart-min-height));
  }

  .canvas {
    inline-size: 100%;
    min-block-size: var(--_chart-height, var(--_chart-min-height));
  }

  .status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
    font-size: var(--mth-font-size-sm, 0.875rem);
    border-radius: var(--mth-radius-sm, 0.375rem);
  }

  .fallback-sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .fallback-visible {
    overflow-inline: auto;
    border-block-start: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    padding-block-start: var(--mth-space-3, 0.75rem);
  }

  .series-slot {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .toggle {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }
  }
`;
