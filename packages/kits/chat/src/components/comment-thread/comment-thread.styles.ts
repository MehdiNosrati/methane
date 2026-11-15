import { css } from 'lit';

export const commentThreadStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .comment {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .author {
    font-weight: var(--mth-font-weight-semibold, 600);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .time {
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    overflow-wrap: anywhere;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .action-btn {
    appearance: none;
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.004 260), oklch(0.25 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .action-btn:focus-visible,
  .reply-input:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  .replies {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-inline-start: var(--mth-space-4, 1rem);
    border-inline-start: 2px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
  }

  .reply-form {
    display: flex;
    gap: var(--mth-space-2, 0.5rem);
    align-items: center;
  }

  .reply-input {
    flex: 1;
    min-inline-size: 0;
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .empty {
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  @media (forced-colors: active) {
    .comment,
    .action-btn,
    .reply-input {
      border-color: CanvasText;
    }
  }
`;
