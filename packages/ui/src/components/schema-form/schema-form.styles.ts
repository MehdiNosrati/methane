import { css } from 'lit';

export const schemaFormStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_sf-bg: var(--mth-color-surface, Canvas);
    --_sf-fg: var(--mth-color-fg, CanvasText);
    --_sf-muted: var(--mth-color-fg-muted, GrayText);
    --_sf-subtle: var(--mth-color-bg-subtle, Field);
    --_sf-border: var(--mth-color-border, ButtonBorder);
    --_sf-focus: var(--mth-color-border-focus, Highlight);
    --_sf-accent: var(--mth-color-accent, Highlight);
    --_sf-accent-fg: var(--mth-color-accent-fg, HighlightText);
    --_sf-danger: var(--mth-color-danger, crimson);
    --_sf-radius: var(--mth-radius-lg, 0.5rem);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    background: var(--_sf-bg);
    color: var(--_sf-fg);
    border: 1px solid var(--_sf-border);
    border-radius: var(--_sf-radius);
  }

  .title {
    margin-block: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .description {
    margin-block: 0;
    color: var(--_sf-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .select-control {
    inline-size: 100%;
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    padding-block: var(--mth-space-control-block, 0.5rem);
    border: 1px solid var(--_sf-border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--_sf-bg);
    color: var(--_sf-fg);
    font: inherit;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_sf-border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--_sf-subtle);
    color: var(--_sf-fg);
    font: inherit;
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .btn-primary {
    background: var(--_sf-accent);
    color: var(--_sf-accent-fg);
    border-color: var(--_sf-accent);
  }

  .btn:focus-visible,
  .select-control:focus-visible {
    outline: 2px solid var(--_sf-focus);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .form,
    .btn,
    .select-control {
      border-color: ButtonBorder;
    }

    .btn-primary {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
