import { css } from 'lit';

export const dropzoneStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: grid;
    justify-items: center;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-6, 1.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 2px dashed var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
    text-align: center;
  }

  :host(:state(dragover)) .base {
    border-color: var(--mth-color-accent);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
  }

  :host(:state(disabled)) .base {
    opacity: 0.6;
  }

  .native-input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .trigger {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    color: var(--mth-color-fg);
  }

  .trigger:disabled {
    cursor: not-allowed;
  }

  .trigger:focus-visible,
  .base:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base,
    .trigger {
      border-color: ButtonText;
    }
  }
`;
