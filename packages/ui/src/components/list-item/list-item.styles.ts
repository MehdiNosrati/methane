import { css } from 'lit';

export const listItemStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_li-bg: transparent;
    --_li-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_li-bg-selected: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
    --_li-fg: var(--mth-color-fg, CanvasText);
    --_li-muted: var(--mth-color-fg-muted, GrayText);
    --_li-focus-ring: var(--mth-color-border-focus, Highlight);
    --_li-pad-block: var(--mth-space-2, 0.5rem);
    --_li-pad-inline: var(--mth-space-3, 0.75rem);
    --_li-gap: var(--mth-space-3, 0.75rem);
  }

  :host(:focus-visible) {
    outline: 2px solid var(--_li-focus-ring);
    outline-offset: -2px;
  }

  :host([selected]) .base {
    background-color: var(--_li-bg-selected);
  }

  :host([interactive]) .base:hover {
    background-color: var(--_li-bg-hover);
  }

  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .base {
    display: flex;
    align-items: center;
    gap: var(--_li-gap);
    padding-block: var(--_li-pad-block);
    padding-inline: var(--_li-pad-inline);
    background-color: var(--_li-bg);
    color: var(--_li-fg);
    border-radius: var(--mth-radius-md, 0.375rem);
  }

  :host([interactive]) .base {
    cursor: pointer;
  }

  .content {
    flex: 1 1 auto;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .description {
    color: var(--_li-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .link {
    color: inherit;
    text-decoration: none;
  }

  .link:hover {
    text-decoration: underline;
  }

  .prefix,
  .suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    :host([selected]) .base {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
