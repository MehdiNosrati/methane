import { css } from 'lit';

export const loadMoreStyles = css`
  :host {
    display: block;
    --_lm-bg: var(--mth-color-surface, oklch(1 0 0));
    --_lm-bg-hover: var(--mth-color-bg-subtle, oklch(0.96 0.005 250));
    --_lm-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_lm-fg-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_lm-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_lm-focus: var(--mth-color-border-focus, oklch(0.55 0.2 250));
    --_lm-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    --_lm-radius: var(--mth-radius-md, 0.5rem);
    --_lm-gap: var(--mth-space-3, 0.75rem);
    color: var(--_lm-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--_lm-gap);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_lm-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_lm-bg);
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
  }

  .progress,
  .status {
    margin: 0;
    color: var(--_lm-fg-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    text-align: center;
  }

  .status--error {
    color: var(--_lm-danger);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    min-block-size: calc(var(--mth-space-8, 2rem) + var(--mth-space-2, 0.5rem));
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_lm-border);
    border-radius: var(--_lm-radius);
    background-color: var(--_lm-bg);
    color: var(--_lm-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
    cursor: pointer;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease),
      border-color var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .action-btn:hover:not(:disabled) {
    background-color: var(--_lm-bg-hover);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--_lm-focus);
    outline-offset: 2px;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    .action-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .item,
    .action-btn {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: ButtonText;
    }

    .action-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
