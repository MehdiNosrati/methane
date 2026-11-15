import { css } from 'lit';

export const calendarHeatmapStyles = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_hm-gap: calc(var(--mth-space-1, 0.25rem) * 0.75);
    --_hm-cell-size: 0.875rem;
    --_hm-radius: var(--mth-radius-xs, 0.125rem);
    --_hm-level-0: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_hm-level-1: var(--mth-color-brand-200, oklch(0.86 0.1 255));
    --_hm-level-2: var(--mth-color-brand-300, oklch(0.77 0.14 255));
    --_hm-level-3: var(--mth-color-brand-400, oklch(0.67 0.18 255));
    --_hm-level-4: var(--mth-color-accent, Highlight);
    --_hm-focus-ring: var(--mth-color-border-focus, Highlight);
    --_hm-muted: var(--mth-color-fg-muted, GrayText);
  }

  .base {
    display: inline-flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: var(--_hm-gap);
  }

  .row {
    display: flex;
    flex-direction: row;
    gap: var(--_hm-gap);
  }

  .cell {
    appearance: none;
    inline-size: var(--_hm-cell-size);
    block-size: var(--_hm-cell-size);
    padding-block: 0;
    padding-inline: 0;
    margin-block: 0;
    margin-inline: 0;
    border: 1px solid var(--mth-color-border, ButtonBorder);
    border-radius: var(--_hm-radius);
    background-color: var(--_hm-level-0);
    cursor: pointer;
    box-sizing: border-box;
  }

  .cell[data-level='1'] {
    background-color: var(--_hm-level-1);
    border-color: transparent;
  }

  .cell[data-level='2'] {
    background-color: var(--_hm-level-2);
    border-color: transparent;
  }

  .cell[data-level='3'] {
    background-color: var(--_hm-level-3);
    border-color: transparent;
  }

  .cell[data-level='4'] {
    background-color: var(--_hm-level-4);
    border-color: transparent;
  }

  .cell[aria-selected='true'] {
    outline: 2px solid var(--_hm-focus-ring);
    outline-offset: 1px;
  }

  .cell:focus-visible {
    outline: 2px solid var(--_hm-focus-ring);
    outline-offset: 1px;
  }

  .legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--_hm-gap);
    color: var(--_hm-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .legend-swatch {
    display: inline-block;
    inline-size: 0.75rem;
    block-size: 0.75rem;
    border-radius: var(--_hm-radius);
    border: 1px solid var(--mth-color-border, ButtonBorder);
    background-color: var(--_hm-level-0);
  }

  .legend-swatch[data-level='1'] {
    background-color: var(--_hm-level-1);
    border-color: transparent;
  }

  .legend-swatch[data-level='2'] {
    background-color: var(--_hm-level-2);
    border-color: transparent;
  }

  .legend-swatch[data-level='3'] {
    background-color: var(--_hm-level-3);
    border-color: transparent;
  }

  .legend-swatch[data-level='4'] {
    background-color: var(--_hm-level-4);
    border-color: transparent;
  }

  @media (forced-colors: active) {
    .cell {
      background-color: Canvas;
      border-color: ButtonBorder;
    }

    .cell[data-level='1'],
    .cell[data-level='2'],
    .cell[data-level='3'],
    .cell[data-level='4'] {
      background-color: Highlight;
      border-color: HighlightText;
    }
  }
`;
