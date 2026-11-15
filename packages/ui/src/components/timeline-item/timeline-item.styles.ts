import { css } from 'lit';

export const timelineItemStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_tl-dot-bg: var(--mth-color-surface, Canvas);
    --_tl-dot-border: var(--mth-color-border-strong, ButtonBorder);
    --_tl-line: var(--mth-color-border, ButtonBorder);
    --_tl-fg: var(--mth-color-fg, CanvasText);
    --_tl-muted: var(--mth-color-fg-muted, GrayText);
    --_tl-dot-size: 0.75rem;
  }

  .base[data-variant='accent'],
  :host([active]) .base {
    --_tl-dot-bg: var(--mth-color-accent, Highlight);
    --_tl-dot-border: var(--mth-color-accent, Highlight);
  }

  .base[data-variant='success'] {
    --_tl-dot-bg: var(--mth-color-success, oklch(0.55 0.17 150));
    --_tl-dot-border: var(--mth-color-success, oklch(0.55 0.17 150));
  }

  .base[data-variant='warning'] {
    --_tl-dot-bg: var(--mth-color-warning, oklch(0.65 0.17 75));
    --_tl-dot-border: var(--mth-color-warning, oklch(0.65 0.17 75));
  }

  .base[data-variant='danger'] {
    --_tl-dot-bg: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_tl-dot-border: var(--mth-color-danger, oklch(0.55 0.22 25));
  }

  .base {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--mth-space-3, 0.75rem);
    color: var(--_tl-fg);
  }

  .rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block-start: 0.25rem;
  }

  .dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_tl-dot-size);
    block-size: var(--_tl-dot-size);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_tl-dot-bg);
    border: 2px solid var(--_tl-dot-border);
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .connector {
    flex: 1 1 auto;
    inline-size: 2px;
    min-block-size: var(--mth-space-4, 1rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
    background-color: var(--_tl-line);
  }

  :host(:last-of-type) .connector {
    display: none;
  }

  .content {
    padding-block-end: var(--mth-space-4, 1rem);
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .timestamp {
    color: var(--_tl-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .body {
    color: var(--_tl-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .meta {
    color: var(--_tl-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .dot {
      border-color: Highlight;
    }

    .connector {
      background-color: ButtonBorder;
    }
  }
`;
