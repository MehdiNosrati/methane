import { css } from 'lit';

export const popoverStyles = css`
  :host {
    display: inline-block;
    position: relative;
    --_popover-bg: var(--mth-color-surface-raised, Canvas);
    --_popover-fg: var(--mth-color-fg, CanvasText);
    --_popover-border: var(--mth-color-border, ButtonBorder);
    --_popover-radius: var(--mth-radius-lg, 0.75rem);
    --_popover-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.14 0.014 262 / 0.14));
    --_popover-pad: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
  }

  .anchor {
    display: inline-flex;
    align-items: center;
  }

  .surface {
    position: fixed;
    margin-block: 0;
    margin-inline: 0;
    z-index: var(--mth-z-index-popover, 500);
    min-inline-size: 8rem;
    max-inline-size: min(24rem, calc(100vi - 1rem));
    padding-block: var(--_popover-pad);
    padding-inline: var(--_popover-pad);
    border: 1px solid var(--_popover-border);
    border-radius: var(--_popover-radius);
    background: var(--_popover-bg);
    color: var(--_popover-fg);
    box-shadow: var(--_popover-shadow);
    box-sizing: border-box;
  }

  .surface[hidden],
  .surface:not([data-mth-open='true']) {
    display: none;
  }

  .surface[data-mth-top-layer-fallback][data-mth-open='true']:not([hidden]) {
    display: block;
    z-index: var(--mth-z-index-popover, 500);
  }

  .arrow {
    position: absolute;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    background: var(--_popover-bg);
    border-inline-start: 1px solid var(--_popover-border);
    border-block-start: 1px solid var(--_popover-border);
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (forced-colors: active) {
    .surface {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }

    .arrow {
      background: Canvas;
      border-color: CanvasText;
    }
  }
`;
