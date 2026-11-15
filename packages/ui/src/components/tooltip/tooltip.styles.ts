import { css } from 'lit';

export const tooltipStyles = css`
  :host {
    display: inline-block;
    position: relative;
    --_tooltip-bg: var(--mth-color-surface-inverse, oklch(0.22 0.01 255));
    --_tooltip-fg: var(--mth-color-fg-inverse, oklch(0.98 0.005 255));
    --_tooltip-border: var(--mth-color-border, oklch(0.35 0.01 255));
    --_tooltip-radius: var(--mth-radius-sm, 0.375rem);
    --_tooltip-shadow: var(--mth-shadow-md, 0 8px 18px oklch(0 0 0 / 0.2));
  }

  .trigger {
    display: inline-flex;
    align-items: center;
  }

  .surface {
    position: fixed;
    margin-block: 0;
    margin-inline: 0;
    z-index: var(--mth-z-index-tooltip, 600);
    max-inline-size: min(20rem, calc(100vi - 1rem));
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_tooltip-border);
    border-radius: var(--_tooltip-radius);
    background: var(--_tooltip-bg);
    color: var(--_tooltip-fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-snug, 1.35);
    box-shadow: var(--_tooltip-shadow);
    box-sizing: border-box;
    pointer-events: auto;
  }

  .surface[hidden],
  .surface:not([data-mth-open='true']) {
    display: none;
  }

  .arrow {
    position: absolute;
    inline-size: 0.4375rem;
    block-size: 0.4375rem;
    background: var(--_tooltip-bg);
    border-inline-start: 1px solid var(--_tooltip-border);
    border-block-start: 1px solid var(--_tooltip-border);
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (forced-colors: active) {
    .surface {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    .arrow {
      background: Canvas;
      border-color: CanvasText;
    }
  }
`;
