import { css } from 'lit';

export const collabCursorsStyles = css`
  :host {
    display: block;
    position: relative;
    pointer-events: none;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    z-index: var(--mth-z-index-overlay, 30);
  }

  .base {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 1px;
    overflow: hidden;
  }

  .cursor {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    transform: translate3d(var(--_cursor-x, 0px), var(--_cursor-y, 0px), 0);
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--mth-space-px, 2px);
    color: var(--_cursor-color, var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260))));
  }

  .pointer {
    display: block;
    inline-size: 1rem;
    block-size: 1rem;
  }

  .name {
    display: inline-block;
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-px, 2px);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_cursor-color, var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.68 0.18 260))));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.99 0 0)));
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    white-space: nowrap;
    max-inline-size: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .selection {
    position: absolute;
    inset-block-start: var(--_sel-y, 0px);
    inset-inline-start: var(--_sel-x, 0px);
    inline-size: var(--_sel-w, 0px);
    block-size: var(--_sel-h, 0px);
    background-color: color-mix(
      in oklch,
      var(--_cursor-color, var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)))) 22%,
      transparent
    );
    border-inline-start: 2px solid var(--_cursor-color, var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260))));
  }

  @media (forced-colors: active) {
    .name {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border: 1px solid HighlightText;
    }

    .selection {
      border-color: Highlight;
    }
  }
`;
