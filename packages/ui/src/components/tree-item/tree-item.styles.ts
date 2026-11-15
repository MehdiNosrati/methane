import { css } from 'lit';

export const treeItemStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_ti-fg: var(--mth-color-fg, CanvasText);
    --_ti-muted: var(--mth-color-fg-muted, GrayText);
    --_ti-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_ti-bg-selected: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_ti-focus-ring: var(--mth-color-border-focus, Highlight);
    --_ti-indent: var(--mth-space-4, 1rem);
  }

  :host(:focus-visible) > .base > .row {
    outline: 2px solid var(--_ti-focus-ring);
    outline-offset: -2px;
  }

  :host([disabled]) > .base > .row {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-block-size: 2rem;
    padding-block: 0.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    color: var(--_ti-fg);
    cursor: pointer;
    user-select: none;
  }

  .row:hover {
    background-color: var(--_ti-bg-hover);
  }

  :host([selected]) > .base > .row {
    background-color: var(--_ti-bg-selected);
  }

  .toggle {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    padding-block: 0;
    padding-inline: 0;
    border: none;
    background: transparent;
    color: var(--_ti-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .toggle[data-leaf='true'] {
    visibility: hidden;
    pointer-events: none;
  }

  .chevron {
    inline-size: 0.875rem;
    block-size: 0.875rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform var(--mth-motion-duration-fast, 120ms) ease;
  }

  :host([expanded]) > .base > .row .chevron {
    transform: rotate(90deg);
  }

  :host(:dir(rtl):not([expanded])) > .base > .row .chevron {
    transform: rotate(180deg);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .label {
    flex: 1 1 auto;
    min-inline-size: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .children {
    padding-inline-start: var(--_ti-indent);
    font-size: 0;
  }

  .children ::slotted(*) {
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    :host([selected]) > .base > .row {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
