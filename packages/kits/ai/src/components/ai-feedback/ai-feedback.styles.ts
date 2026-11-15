import { css } from 'lit';

export const aiFeedbackStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_fb-bg: var(--mth-color-surface, oklch(99% 0 0));
    --_fb-subtle: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_fb-fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_fb-muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_fb-border: var(--mth-color-border, oklch(86% 0.01 260));
    --_fb-accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_fb-accent-bg: var(--mth-color-accent-subtle, oklch(95% 0.03 255));
    --_fb-focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_fb-radius: var(--mth-radius-md, 0.5rem);
  }

  :host([hidden]) {
    display: none;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    color: var(--_fb-fg);
  }

  .rating-row,
  .reasons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_fb-border);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_fb-bg);
    color: var(--_fb-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .chip[aria-pressed='true'] {
    border-color: var(--_fb-accent);
    background-color: var(--_fb-accent-bg);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .chip:focus-visible {
    outline: 2px solid var(--_fb-focus);
    outline-offset: 2px;
  }

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .comment-row {
    display: flex;
    gap: var(--mth-space-2, 0.5rem);
    align-items: center;
  }

  .comment-input {
    flex: 1;
    min-inline-size: 12rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_fb-border);
    border-radius: var(--_fb-radius);
    background-color: var(--_fb-bg);
    color: var(--_fb-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .comment-input:focus-visible {
    outline: 2px solid var(--_fb-focus);
    outline-offset: 1px;
  }

  .thanks {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fb-muted);
  }
`;
