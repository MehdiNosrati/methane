import { css } from 'lit';

export const asyncSearchStyles = css`
  :host {
    display: block;
    position: relative;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(#0f172a, #f8fafc));
  }

  :host([disabled]) {
    opacity: 0.55;
    cursor: not-allowed;
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
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-block-size: 2.375rem;
    padding-block: 0.25rem;
    padding-inline: 0.625rem;
    border-radius: 0.375rem;
    border: 1px solid var(--mth-async-search-border, var(--mth-color-border, light-dark(#cbd5e1, #334155)));
    background-color: var(--mth-async-search-bg, var(--mth-color-surface, light-dark(#ffffff, #0f172a)));
    box-sizing: border-box;
  }

  .control:focus-within {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 1px;
  }

  .input {
    flex: 1 1 auto;
    min-inline-size: 4rem;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: 0.1875rem;
    outline: none;
  }

  .clear-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--mth-color-fg-muted, light-dark(#64748b, #94a3b8));
    cursor: pointer;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }

  .listbox {
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    border-radius: 0.375rem;
    border: 1px solid var(--mth-color-border, light-dark(#cbd5e1, #334155));
    background-color: var(--mth-color-surface-raised, light-dark(#ffffff, #1e293b));
    box-shadow: 0 8px 20px oklch(0 0 0 / 0.12);
    max-block-size: 14rem;
    overflow-block: auto;
    z-index: var(--mth-z-index-popover, 500);
  }

  .listbox:not([data-open='true']) {
    display: none;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 0.375rem;
    padding-inline: 0.625rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .option[data-active='true'] {
    background-color: var(--mth-color-bg-subtle, light-dark(#f1f5f9, #334155));
  }

  .option[aria-selected='true'] {
    font-weight: 600;
    color: var(--mth-color-accent, oklch(0.55 0.22 255));
  }

  .option[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .status {
    padding: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(#64748b, #94a3b8));
  }

  .status[data-status='error'] {
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(#475569, #94a3b8));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
  }

  @media (forced-colors: active) {
    .control,
    .listbox {
      border: 1px solid CanvasText;
      background-color: Canvas;
    }

    .option[aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
    }
  }
`;
