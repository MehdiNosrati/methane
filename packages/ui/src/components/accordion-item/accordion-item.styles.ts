import { css } from 'lit';

export const accordionItemStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_acc-bg: var(--mth-color-surface, Canvas);
    --_acc-fg: var(--mth-color-fg, CanvasText);
    --_acc-muted: var(--mth-color-fg-muted, GrayText);
    --_acc-border: var(--mth-color-border, ButtonBorder);
    --_acc-hover-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_acc-pad-block: calc(var(--mth-space-3, 0.75rem) * var(--mth-density, 1));
    --_acc-pad-inline: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
  }

  .base {
    border-block-end: 1px solid var(--_acc-border);
    background-color: var(--_acc-bg);
    color: var(--_acc-fg);
  }

  .header {
    margin-block: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    inline-size: 100%;
    padding-block: var(--_acc-pad-block);
    padding-inline: var(--_acc-pad-inline);
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .trigger:hover:not(:disabled) {
    background-color: var(--_acc-hover-bg);
  }

  .trigger:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: -2px;
  }

  .trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .heading {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--_acc-muted);
    transition: transform var(--mth-motion-duration-fast, 120ms)
      var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .trigger[aria-expanded='true'] .indicator {
    transform: rotate(180deg);
  }

  .chevron-svg {
    inline-size: 1rem;
    block-size: 1rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .panel {
    overflow: hidden;
  }

  .panel[hidden] {
    display: none;
  }

  .content {
    padding-block-start: 0;
    padding-block-end: var(--_acc-pad-block);
    padding-inline: var(--_acc-pad-inline);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--_acc-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border-block-end: 1px solid ButtonBorder;
    }

    .trigger {
      color: ButtonText;
    }

    .trigger:disabled {
      color: GrayText;
    }

    .trigger:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
