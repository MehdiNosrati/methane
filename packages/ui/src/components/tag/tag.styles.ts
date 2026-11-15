import { css } from 'lit';

export const tagStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_tag-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_tag-fg: var(--mth-color-fg, CanvasText);
    --_tag-border: var(--mth-color-border, ButtonBorder);
    --_tag-radius: var(--mth-radius-md, 0.375rem);
    --_tag-pad-block: calc(var(--mth-space-1, 0.25rem) * 0.75);
    --_tag-pad-inline: var(--mth-space-2, 0.5rem);
    --_tag-font-size: var(--mth-font-size-xs, 0.75rem);
    --_tag-gap: var(--mth-space-1, 0.25rem);
    --_tag-focus-ring: var(--mth-color-border-focus, Highlight);
  }

  .base[data-variant='accent'] {
    --_tag-bg: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_tag-fg: var(--mth-color-accent, Highlight);
    --_tag-border: var(--mth-color-accent, Highlight);
  }

  .base[data-variant='success'] {
    --_tag-bg: var(--mth-color-success-subtle, oklch(0.96 0.03 150));
    --_tag-fg: var(--mth-color-success, oklch(0.45 0.17 150));
    --_tag-border: var(--mth-color-success, oklch(0.6 0.17 150));
  }

  .base[data-variant='warning'] {
    --_tag-bg: var(--mth-color-warning-subtle, oklch(0.96 0.04 75));
    --_tag-fg: var(--mth-color-warning, oklch(0.5 0.17 75));
    --_tag-border: var(--mth-color-warning, oklch(0.7 0.17 75));
  }

  .base[data-variant='danger'] {
    --_tag-bg: var(--mth-color-danger-subtle, oklch(0.96 0.04 25));
    --_tag-fg: var(--mth-color-danger, oklch(0.5 0.22 25));
    --_tag-border: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .base[data-size='sm'] {
    --_tag-pad-block: 0.0625rem;
    --_tag-pad-inline: var(--mth-space-1, 0.25rem);
    --_tag-font-size: 0.6875rem;
  }

  .base[data-size='lg'] {
    --_tag-pad-block: var(--mth-space-1, 0.25rem);
    --_tag-pad-inline: var(--mth-space-3, 0.75rem);
    --_tag-font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .base[data-pill='true'] {
    --_tag-radius: var(--mth-radius-full, 9999px);
  }

  .base[data-selected='true'] {
    --_tag-bg: var(--mth-color-accent, Highlight);
    --_tag-fg: var(--mth-color-accent-fg, HighlightText);
    --_tag-border: var(--mth-color-accent, Highlight);
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--_tag-gap);
    padding-block: var(--_tag-pad-block);
    padding-inline: var(--_tag-pad-inline);
    border: 1px solid var(--_tag-border);
    border-radius: var(--_tag-radius);
    background-color: var(--_tag-bg);
    color: var(--_tag-fg);
    font-size: var(--_tag-font-size);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    white-space: nowrap;
    max-inline-size: 100%;
  }

  :host([disabled]) .base {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--_tag-gap);
    min-inline-size: 0;
    color: inherit;
    font: inherit;
    line-height: inherit;
  }

  button.trigger {
    appearance: none;
    background: transparent;
    border: none;
    padding-block: 0;
    padding-inline: 0;
    margin-block: 0;
    margin-inline: 0;
    cursor: pointer;
    border-radius: var(--mth-radius-xs, 0.125rem);
  }

  button.trigger:disabled {
    cursor: not-allowed;
  }

  button.trigger:focus-visible,
  .remove:focus-visible {
    outline: 2px solid var(--_tag-focus-ring);
    outline-offset: 1px;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: inherit;
    padding-block: 0.125rem;
    padding-inline: 0.125rem;
    margin-inline-end: -0.125rem;
    border-radius: var(--mth-radius-full, 9999px);
    cursor: pointer;
    opacity: 0.8;
    transition: opacity var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .remove:hover:not(:disabled) {
    opacity: 1;
  }

  .remove:disabled {
    cursor: not-allowed;
  }

  .remove-icon {
    inline-size: 0.875em;
    block-size: 0.875em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border-color: ButtonBorder;
    }

    .base[data-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
