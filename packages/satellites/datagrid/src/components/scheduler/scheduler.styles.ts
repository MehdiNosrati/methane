import { css } from 'lit';

export const schedulerStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_sc-bg: var(--mth-color-surface, Canvas);
    --_sc-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_sc-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_sc-focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_sc-accent: var(--mth-color-accent, oklch(0.55 0.2 250));
    --_sc-accent-fg: var(--mth-color-accent-fg, oklch(0.99 0.005 250));
    --_sc-muted: var(--mth-color-fg-muted, GrayText);
    --_sc-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    background: var(--_sc-bg);
    border: 1px solid var(--_sc-border);
    border-radius: var(--_sc-radius);
    overflow: hidden;
  }

  .viewport {
    overflow: auto;
    max-block-size: 24rem;
    inline-size: 100%;
  }

  .grid {
    display: grid;
    inline-size: 100%;
  }

  .row {
    display: flex;
    align-items: stretch;
    min-block-size: var(--_sc-row-height, 3rem);
    border-block-end: 1px solid var(--_sc-border);
    position: relative;
  }

  .row:focus-visible {
    outline: 2px solid var(--_sc-focus);
    outline-offset: -2px;
  }

  .header-row {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--mth-z-index-sticky, 10);
    background: var(--_sc-subtle);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .resource-cell {
    box-sizing: border-box;
    flex: 0 0 10rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--_sc-border);
    display: flex;
    align-items: center;
  }

  .track {
    position: relative;
    flex: 1 1 auto;
    display: flex;
  }

  .day-cell {
    box-sizing: border-box;
    flex: 1 0 5rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-inline-end: 1px solid var(--_sc-border);
    display: flex;
    align-items: center;
  }

  .event-bar {
    position: absolute;
    inset-block: 0.375rem;
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_sc-accent);
    color: var(--_sc-accent-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-bar:focus-visible {
    outline: 2px solid var(--_sc-focus);
    outline-offset: 2px;
  }

  .status {
    padding: var(--mth-space-4, 1rem);
    color: var(--_sc-muted);
    text-align: center;
  }

  @media (forced-colors: active) {
    .base,
    .row,
    .resource-cell,
    .day-cell {
      border-color: ButtonBorder;
    }

    .event-bar {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
      border-color: HighlightText;
    }

    .row:focus-visible,
    .event-bar:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
