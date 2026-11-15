import { css } from 'lit';

export const messageComposerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .shell {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-lg, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
  }

  .shell:focus-within {
    border-color: var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 1px;
  }

  :host(:state(invalid)) .shell {
    border-color: var(--mth-color-danger, oklch(0.58 0.22 25));
  }

  .textarea {
    inline-size: 100%;
    min-block-size: 2.5rem;
    max-block-size: 12rem;
    border: none;
    background: transparent;
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    resize: vertical;
    padding-inline: var(--mth-space-1, 0.25rem);
    padding-block: var(--mth-space-1, 0.25rem);
    box-sizing: border-box;
  }

  .textarea:focus {
    outline: none;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .actions-group {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .action-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    min-block-size: 2rem;
    border-radius: var(--mth-radius-md, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.004 260), oklch(0.25 0.01 260)));
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .send-btn {
    background-color: var(--mth-color-accent, oklch(0.55 0.22 260));
    border-color: var(--mth-color-accent, oklch(0.55 0.22 260));
    color: var(--mth-color-accent-fg, oklch(1 0 0));
  }

  .stop-btn {
    background-color: var(--mth-color-danger, oklch(0.58 0.22 25));
    border-color: var(--mth-color-danger, oklch(0.58 0.22 25));
    color: var(--mth-color-accent-fg, oklch(1 0 0));
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  .action-btn:disabled,
  .textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 25));
  }

  @media (forced-colors: active) {
    .shell,
    .action-btn {
      border-color: CanvasText;
    }

    .send-btn,
    .stop-btn {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
