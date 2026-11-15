import { css } from 'lit';

export const chatThreadStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .base {
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
    overflow: hidden;
  }

  .scroller {
    overflow-block: auto;
    max-block-size: 32rem;
    padding-inline: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-3, 0.75rem);
  }

  .stream {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding-block-start: var(--_ct-pad-top, 0px);
    padding-block-end: var(--_ct-pad-bottom, 0px);
  }

  .date-separator,
  .unread-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
    margin-block: var(--mth-space-1, 0.25rem);
  }

  .unread-divider {
    color: var(--mth-color-danger, oklch(0.58 0.22 25));
    font-weight: var(--mth-font-weight-semibold, 600);
    border-block-start: 1px solid var(--mth-color-danger, oklch(0.58 0.22 25));
    padding-block-start: var(--mth-space-1, 0.25rem);
  }

  .message {
    display: flex;
    align-items: flex-start;
    gap: var(--mth-space-3, 0.75rem);
  }

  .message[data-self='true'] {
    flex-direction: row-reverse;
  }

  .bubble {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    max-inline-size: 80%;
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.24 0.01 260)));
  }

  .message[data-self='true'] .bubble {
    background-color: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 260), oklch(0.28 0.08 260)));
  }

  .header {
    display: flex;
    align-items: baseline;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .author {
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .timestamp {
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    overflow-wrap: anywhere;
  }

  .state-box {
    padding-inline: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-6, 1.5rem);
    text-align: center;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .scroll-bottom-wrap {
    display: flex;
    justify-content: flex-end;
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    border-block-start: 1px solid var(--mth-color-border, light-dark(oklch(0.9 0.006 260), oklch(0.32 0.012 260)));
  }

  .scroll-bottom,
  .retry-btn {
    appearance: none;
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    border-radius: var(--mth-radius-md, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .scroll-bottom:focus-visible,
  .retry-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base,
    .bubble,
    .scroll-bottom,
    .retry-btn {
      border: 1px solid CanvasText;
    }

    .unread-divider {
      color: Highlight;
      border-color: Highlight;
    }
  }
`;
