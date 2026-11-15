import { css } from 'lit';

export const paginationStyles = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  [part='list'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  [part='prev'],
  [part='next'],
  [part='page'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, oklch(0.91 0.009 255));
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--mth-color-surface, Canvas);
    color: var(--mth-color-fg, CanvasText);
    font-family: inherit;
    font-size: inherit;
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
    box-sizing: border-box;
  }

  [part='prev']:hover:not(:disabled),
  [part='next']:hover:not(:disabled),
  [part='page']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
  }

  [part='prev']:focus-visible,
  [part='next']:focus-visible,
  [part='page']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  [part='page'][aria-current='page'] {
    background-color: var(--mth-color-accent, oklch(0.56 0.21 255));
    color: var(--mth-color-accent-fg, oklch(0.99 0 0));
    border-color: var(--mth-color-accent, oklch(0.56 0.21 255));
  }

  [part='prev']:disabled,
  [part='next']:disabled,
  [part='page']:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='ellipsis'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2rem;
    block-size: 2.25rem;
    color: var(--mth-color-fg-muted, GrayText);
    user-select: none;
  }

  @media (forced-colors: active) {
    [part='prev'],
    [part='next'],
    [part='page'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }

    [part='page'][aria-current='page'] {
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    [part='prev']:disabled,
    [part='next']:disabled,
    [part='page']:disabled {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }
  }
`;
