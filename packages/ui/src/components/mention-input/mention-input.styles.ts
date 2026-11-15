import { css } from 'lit';

export const mentionInputStyles = css`
  :host {
    display: inline-block;
    position: relative;
    min-inline-size: var(--mth-mention-min-inline-size, 16rem);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .control {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.18 0.01 250)));
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
  }

  :host([data-user-invalid]) .control {
    border-color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.68 0.18 25)));
  }

  :host([data-disabled]) .control,
  :host([disabled]) .control {
    opacity: 0.55;
    pointer-events: none;
  }

  .input {
    display: block;
    inline-size: 100%;
    box-sizing: border-box;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    resize: vertical;
    padding-block: var(--mth-space-1, 0.25rem);
  }

  .input:focus {
    outline: none;
  }

  .control:focus-within {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  .popup {
    position: fixed;
    z-index: var(--mth-z-index-popover, 40);
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    min-inline-size: 14rem;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface-raised, light-dark(oklch(1 0 0), oklch(0.2 0.01 250)));
    box-shadow: var(--mth-shadow-md, 0 8px 24px light-dark(oklch(0.2 0.02 250 / 0.12), oklch(0 0 0 / 0.45)));
    inset: auto;
  }

  .popup[hidden] {
    display: none;
  }

  .listbox {
    list-style: none;
    margin: 0;
    padding: 0;
    max-block-size: var(--mth-mention-popup-max-block-size, 14rem);
    overflow-block: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.375rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.375rem);
    cursor: pointer;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .option:hover:not([aria-disabled='true']),
  .option[data-active='true']:not([aria-disabled='true']),
  .option[aria-selected='true'] {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.01 250), oklch(0.28 0.02 250)));
  }

  .option[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .option-handle {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .empty {
    padding: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.68 0.18 25)));
  }

  @media (forced-colors: active) {
    .control,
    .popup {
      border-color: ButtonText;
    }

    .option[data-active='true'],
    .option[aria-selected='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
`;
