import { css } from 'lit';

export const hoverCardStyles = css`
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_hc-bg: var(--mth-color-surface-raised, Canvas);
    --_hc-fg: var(--mth-color-fg, CanvasText);
    --_hc-border: var(--mth-color-border, ButtonBorder);
    --_hc-radius: var(--mth-radius-lg, 0.5rem);
    --_hc-shadow: var(--mth-shadow-lg, 0 10px 24px oklch(0.15 0.01 255 / 0.14));
    --_hc-z: var(--mth-z-index-popover, 1500);
    --_hc-pad: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
  }

  :host([hidden]) {
    display: none;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
  }

  .popup {
    position: fixed;
    z-index: var(--_hc-z);
    min-inline-size: 14rem;
    max-inline-size: min(22rem, 90vw);
    padding-block: var(--_hc-pad);
    padding-inline: var(--_hc-pad);
    border: 1px solid var(--_hc-border);
    border-radius: var(--_hc-radius);
    background-color: var(--_hc-bg);
    color: var(--_hc-fg);
    box-shadow: var(--_hc-shadow);
    box-sizing: border-box;
  }

  .popup[hidden] {
    display: none;
  }

  .arrow {
    position: absolute;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    background-color: var(--_hc-bg);
    border-inline-start: 1px solid var(--_hc-border);
    border-block-start: 1px solid var(--_hc-border);
    transform: rotate(45deg);
    pointer-events: none;
  }

  .content {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  @media (prefers-reduced-motion: reduce) {
    .popup {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .popup {
      border: 1px solid CanvasText;
      forced-color-adjust: auto;
    }
  }
`;
