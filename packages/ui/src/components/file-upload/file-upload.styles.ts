import { css } from 'lit';

export const fileUploadStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 600;
  }

  .drop-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 2px dashed var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
  }

  :host(:state(dragover)) .drop-area {
    border-color: var(--mth-color-accent);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
  }

  :host(:state(invalid)) .drop-area {
    border-color: var(--mth-color-danger);
  }

  :host(:state(disabled)) .drop-area {
    opacity: 0.6;
  }

  .hint {
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted);
  }

  .native-input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .browse-button,
  .remove-button {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    color: var(--mth-color-fg);
  }

  .list {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface);
  }

  .preview {
    inline-size: 2rem;
    block-size: 2rem;
    object-fit: cover;
    border-radius: var(--mth-radius-sm, 0.25rem);
    border: 1px solid var(--mth-color-border);
  }

  .meta {
    flex: 1;
    min-inline-size: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger);
  }

  @media (forced-colors: active) {
    .drop-area,
    .browse-button,
    .remove-button,
    .item {
      border-color: ButtonText;
    }
  }
`;
