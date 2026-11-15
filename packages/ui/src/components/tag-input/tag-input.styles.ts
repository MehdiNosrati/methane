import { css } from 'lit';

export const tagInputStyles = css`
  :host {
    display: block;
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
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-block-size: 2.375rem;
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--mth-tag-input-border, var(--mth-color-border, light-dark(#cbd5e1, #334155)));
    background-color: var(--mth-tag-input-bg, var(--mth-color-surface, light-dark(#ffffff, #0f172a)));
    box-sizing: border-box;
  }

  .control:focus-within {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 1px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding-block: 0.125rem;
    padding-inline: 0.5rem 0.25rem;
    border-radius: 9999px;
    font-size: var(--mth-font-size-xs, 0.75rem);
    background-color: var(
      --mth-tag-input-chip-bg,
      var(--mth-color-accent-subtle, light-dark(#eff6ff, #1e3a8a))
    );
  }

  .tag-remove {
    appearance: none;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0 0.125rem;
    line-height: 1;
    border-radius: 9999px;
  }

  .tag-remove:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
  }

  .input {
    flex: 1 1 6rem;
    min-inline-size: 4rem;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: 0.1875rem;
    outline: none;
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
    .control {
      border: 1px solid CanvasText;
      background-color: Canvas;
    }

    .tag {
      border: 1px solid ButtonText;
    }
  }
`;
