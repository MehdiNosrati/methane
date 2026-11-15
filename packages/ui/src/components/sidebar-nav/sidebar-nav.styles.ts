import { css } from 'lit';

export const sidebarNavStyles = css`
  :host {
    --_snav-bg: var(--mth-color-surface, Canvas);
    --_snav-bg-hover: var(--mth-color-bg-subtle, oklch(0.95 0.01 255));
    --_snav-fg: var(--mth-color-fg, CanvasText);
    --_snav-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_snav-border: var(--mth-color-border, ButtonBorder);
    --_snav-focus: var(--mth-color-border-focus, Highlight);
    --_snav-accent-bg: var(--mth-color-accent-subtle, oklch(0.92 0.05 255));
    --_snav-accent-fg: var(--mth-color-accent-fg, CanvasText);
    --_snav-radius: var(--mth-radius-md, 0.375rem);
    --_snav-space-1: var(--mth-space-1, 0.25rem);
    --_snav-space-2: var(--mth-space-2, 0.5rem);
    --_snav-space-3: var(--mth-space-3, 0.75rem);
    --_snav-font: var(--mth-font-sans, system-ui, sans-serif);
    --_snav-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_snav-font-xs: var(--mth-font-size-xs, 0.75rem);
    --_snav-weight-medium: var(--mth-font-weight-medium, 500);
    --_snav-weight-semibold: var(--mth-font-weight-semibold, 600);

    display: block;
    box-sizing: border-box;
    font-family: var(--_snav-font);
    color: var(--_snav-fg);
    inline-size: 16rem;
  }

  :host(:state(collapsed)),
  :host([collapsed]) {
    inline-size: 4rem;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    background-color: var(--_snav-bg);
    border-inline-end: 1px solid var(--_snav-border);
    padding: var(--_snav-space-2);
    gap: var(--_snav-space-2);
  }

  [part='header'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_snav-space-2);
  }

  [part='toggle'] {
    border: 1px solid var(--_snav-border);
    border-radius: var(--_snav-radius);
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding-block: var(--_snav-space-1);
    padding-inline: var(--_snav-space-2);
    font: inherit;
  }

  [part='toggle']:focus-visible {
    outline: 2px solid var(--_snav-focus);
    outline-offset: 2px;
  }

  [part='nav'] {
    flex: 1 1 auto;
    min-block-size: 0;
    overflow-block: auto;
  }

  [part='list'] {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  [part='group-label'] {
    font-size: var(--_snav-font-xs);
    font-weight: var(--_snav-weight-semibold);
    color: var(--_snav-fg-muted);
    padding-block: var(--_snav-space-2) var(--_snav-space-1);
    padding-inline: var(--_snav-space-2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  :host([collapsed]) [part='group-label'],
  :host([collapsed]) [part='item-label'],
  :host([collapsed]) [part='badge'] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    inline-size: 100%;
    box-sizing: border-box;
    padding-block: var(--_snav-space-2);
    padding-inline: var(--_snav-space-3);
    border: none;
    border-radius: var(--_snav-radius);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--_snav-font-sm);
    font-weight: var(--_snav-weight-medium);
    text-align: start;
    text-decoration: none;
    cursor: pointer;
  }

  [part='item']:hover:not([aria-disabled='true']) {
    background-color: var(--_snav-bg-hover);
  }

  [part='item'][aria-current='page'] {
    background-color: var(--_snav-accent-bg);
    color: var(--_snav-accent-fg);
    font-weight: var(--_snav-weight-semibold);
  }

  [part='item'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='item']:focus-visible {
    outline: 2px solid var(--_snav-focus);
    outline-offset: -2px;
  }

  [part='badge'] {
    font-size: var(--_snav-font-xs);
    padding-block: 1px;
    padding-inline: var(--_snav-space-1);
    border-radius: var(--_snav-radius);
    border: 1px solid var(--_snav-border);
  }

  [part='footer'] {
    padding-block-start: var(--_snav-space-2);
    border-block-start: 1px solid var(--_snav-border);
  }

  @media (forced-colors: active) {
    [part='base'],
    [part='toggle'],
    [part='badge'] {
      border-color: ButtonBorder;
    }

    [part='item'][aria-current='page'] {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    [part='item']:focus-visible,
    [part='toggle']:focus-visible {
      outline-color: Highlight;
    }
  }
`;
