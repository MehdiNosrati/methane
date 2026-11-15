import { css } from 'lit';

export const rruleEditorStyles = css`
  :host {
    display: block;
    --_rr-bg: var(--mth-color-surface, oklch(1 0 0));
    --_rr-subtle: var(--mth-color-bg-subtle, oklch(0.96 0.005 250));
    --_rr-fg: var(--mth-color-fg, oklch(0.2 0.02 250));
    --_rr-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_rr-border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_rr-focus: var(--mth-color-border-focus, oklch(0.55 0.2 250));
    --_rr-accent: var(--mth-color-accent, oklch(0.54 0.2 255));
    --_rr-accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_rr-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    color: var(--_rr-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_rr-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--_rr-bg);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .field-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_rr-muted);
  }

  .control {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_rr-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_rr-bg);
    color: var(--_rr-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .control:focus-visible,
  .weekday-btn:focus-visible {
    outline: 2px solid var(--_rr-focus);
    outline-offset: 2px;
  }

  .control:disabled,
  .weekday-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .interval-input,
  .count-input {
    inline-size: 4.5rem;
    font-variant-numeric: tabular-nums;
  }

  .weekdays {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-1, 0.25rem);
  }

  .weekday-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_rr-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--_rr-bg);
    color: var(--_rr-fg);
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .weekday-btn[aria-pressed='true'] {
    background-color: var(--_rr-accent);
    border-color: var(--_rr-accent);
    color: var(--_rr-accent-fg);
  }

  .rule-readout {
    margin: 0;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-xs, 0.25rem);
    background-color: var(--_rr-subtle);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .preview {
    margin: 0;
    padding-inline-start: var(--mth-space-4, 1rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_rr-muted);
  }

  .hint,
  .error {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .hint {
    color: var(--_rr-muted);
  }

  .error {
    color: var(--_rr-danger);
  }

  @media (forced-colors: active) {
    .base,
    .control,
    .weekday-btn {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: ButtonText;
    }

    .weekday-btn[aria-pressed='true'] {
      background-color: Highlight;
      color: HighlightText;
    }

    .control:focus-visible,
    .weekday-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
