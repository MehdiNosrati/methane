import { css } from 'lit';

export const cronBuilderStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-text);
  }

  .base {
    display: grid;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
  }

  :host(:state(disabled)) .base {
    opacity: 0.6;
  }

  :host(:state(invalid)) .base {
    border-color: var(--mth-color-danger);
  }

  .label {
    font-size: var(--mth-text-sm, 0.875rem);
    font-weight: 600;
    color: var(--mth-color-text);
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .preset {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-text-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface-subtle, var(--mth-color-surface));
    color: var(--mth-color-text);
  }

  .preset[aria-pressed='true'] {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-contrast);
    border-color: var(--mth-color-accent);
  }

  .preset:disabled {
    cursor: not-allowed;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(5, minmax(3.5rem, 1fr));
    gap: var(--mth-space-2, 0.5rem);
  }

  .field {
    display: grid;
    gap: var(--mth-space-1, 0.25rem);
  }

  .field-label {
    font-size: var(--mth-text-xs, 0.75rem);
    color: var(--mth-color-text-muted);
  }

  .field-input {
    inline-size: 100%;
    box-sizing: border-box;
    font-family: var(--mth-font-mono, monospace);
    font-size: var(--mth-text-sm, 0.875rem);
    text-align: center;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface);
    color: var(--mth-color-text);
  }

  .summary {
    font-size: var(--mth-text-xs, 0.75rem);
    color: var(--mth-color-text-muted);
  }

  @media (forced-colors: active) {
    .base,
    .preset,
    .field-input {
      border-color: ButtonText;
    }

    .preset[aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
`;
