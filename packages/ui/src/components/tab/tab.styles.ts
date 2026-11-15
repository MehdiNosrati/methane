import { css } from 'lit';

export const tabStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    outline: none;
    color: var(--mth-color-fg-muted, CanvasText);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  :host(:state(selected)),
  :host([selected]) {
    color: var(--mth-color-accent, Highlight);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.48;
    cursor: not-allowed;
  }

  [part='base'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 2px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem) var(--mth-radius-sm, 0.25rem) 0 0;
    transition:
      color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  :host(:state(selected)) [part='base'],
  :host([selected]) [part='base'] {
    border-block-end-color: var(--mth-color-accent, Highlight);
  }

  :host(:hover:not([disabled])) [part='base'] {
    color: var(--mth-color-fg, CanvasText);
  }

  :host(:focus-visible) [part='base'] {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='base'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host(:state(selected)) [part='base'],
    :host([selected]) [part='base'] {
      color: Highlight;
      border-block-end-color: Highlight;
    }

    :host(:state(disabled)),
    :host([disabled]) {
      color: GrayText;
      opacity: 1;
    }
  }
`;
