import { css } from '@methane/core';

export const sessionListStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, oklch(18% 0.01 260));
  }

  :host([hidden]),
  [hidden] {
    display: none;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .revoke-others-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-danger, oklch(55% 0.22 25));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: transparent;
    color: var(--mth-color-danger, oklch(55% 0.22 25));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .revoke-others-btn:hover:not(:disabled) {
    background-color: var(--mth-color-danger-subtle, oklch(94% 0.05 25));
  }

  .revoke-others-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
    outline-offset: 2px;
  }

  .revoke-others-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .session-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface-raised, oklch(100% 0 0));
  }

  .session-card[data-current='true'] {
    border-color: var(--mth-color-accent, oklch(55% 0.18 255));
  }

  .session-info {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .session-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .device-name {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg, oklch(18% 0.01 260));
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-3, 0.75rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, oklch(48% 0.01 260));
  }

  .revoke-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--mth-color-surface, oklch(99% 0 0));
    color: var(--mth-color-fg, oklch(18% 0.01 260));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .revoke-btn:hover:not(:disabled) {
    background-color: var(--mth-color-danger-subtle, oklch(94% 0.05 25));
    border-color: var(--mth-color-danger, oklch(55% 0.22 25));
    color: var(--mth-color-danger, oklch(55% 0.22 25));
  }

  .revoke-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(55% 0.18 255));
    outline-offset: 2px;
  }

  .revoke-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty {
    margin: 0;
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px dashed var(--mth-color-border, oklch(86% 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    text-align: center;
  }
`;
