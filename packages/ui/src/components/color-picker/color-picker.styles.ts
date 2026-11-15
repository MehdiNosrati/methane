import { css } from 'lit';

export const colorPickerStyles = css`
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-text);
  }

  .base {
    display: grid;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-text-sm, 0.875rem);
    font-weight: 600;
    color: var(--mth-color-text);
  }

  .control {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
  }

  :host(:state(disabled)) .control {
    opacity: 0.6;
  }

  :host(:state(invalid)) .control {
    border-color: var(--mth-color-danger);
  }

  .swatch-preview {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    flex-shrink: 0;
    border-radius: var(--mth-radius-sm, 0.25rem);
    border: 1px solid var(--mth-color-border);
    background: var(--_mth-color-preview, currentColor);
  }

  .input {
    inline-size: 6.5rem;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--mth-color-text);
    font-family: var(--mth-font-mono, monospace);
    font-size: var(--mth-text-sm, 0.875rem);
  }

  .trigger,
  .eyedropper {
    cursor: pointer;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface-subtle, var(--mth-color-surface));
    color: var(--mth-color-text);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
    font-size: var(--mth-text-xs, 0.75rem);
  }

  .popover {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--mth-z-popover, 30);
    min-inline-size: 15rem;
    display: grid;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface-raised, var(--mth-color-surface));
    box-shadow: var(--mth-shadow-md);
  }

  .popover[hidden] {
    display: none;
  }

  .sliders {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
  }

  .slider-row {
    display: grid;
    grid-template-columns: 5rem 1fr;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-text-xs, 0.75rem);
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(6, 1.5rem);
    gap: var(--mth-space-1, 0.25rem);
  }

  .swatch {
    inline-size: 1.5rem;
    block-size: 1.5rem;
    padding: 0;
    cursor: pointer;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_mth-swatch-color, currentColor);
  }

  @media (forced-colors: active) {
    .control,
    .popover,
    .trigger,
    .eyedropper,
    .swatch {
      border-color: ButtonText;
    }

    .swatch-preview,
    .swatch {
      forced-color-adjust: none;
    }
  }
`;
