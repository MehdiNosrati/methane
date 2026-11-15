import { css } from 'lit';

export const thinkingIndicatorStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_ti-bg: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
    --_ti-fg: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    --_ti-muted: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
    --_ti-border: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    --_ti-focus: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    --_ti-radius: var(--mth-radius-md, 0.5rem);
  }

  :host([hidden]) {
    display: none;
  }

  .base {
    border: 1px solid var(--_ti-border);
    border-radius: var(--_ti-radius);
    background-color: var(--_ti-bg);
    color: var(--_ti-fg);
  }

  .trigger {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: 100%;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    text-align: start;
    cursor: pointer;
  }

  .trigger:focus-visible {
    outline: 2px solid var(--_ti-focus);
    outline-offset: -2px;
  }

  .label {
    flex: 1;
  }

  .chevron {
    transition: transform var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  :host(:state(open)) .chevron {
    transform: rotate(180deg);
  }

  .panel {
    padding-block: 0 var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--_ti-border);
    padding-block-start: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_ti-muted);
    white-space: pre-wrap;
  }

  .panel[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .chevron {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .panel {
      border-block-start-color: CanvasText;
    }

    .trigger:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
