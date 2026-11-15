import { css } from 'lit';

export const formWizardStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_wiz-bg: var(--mth-color-surface, Canvas);
    --_wiz-fg: var(--mth-color-fg, CanvasText);
    --_wiz-muted: var(--mth-color-fg-muted, GrayText);
    --_wiz-subtle: var(--mth-color-bg-subtle, Field);
    --_wiz-border: var(--mth-color-border, ButtonBorder);
    --_wiz-focus: var(--mth-color-border-focus, Highlight);
    --_wiz-accent: var(--mth-color-accent, Highlight);
    --_wiz-accent-fg: var(--mth-color-accent-fg, HighlightText);
    --_wiz-danger: var(--mth-color-danger, crimson);
    --_wiz-radius: var(--mth-radius-lg, 0.5rem);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    background: var(--_wiz-bg);
    color: var(--_wiz-fg);
    border: 1px solid var(--_wiz-border);
    border-radius: var(--_wiz-radius);
  }

  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    list-style: none;
    margin-block: 0;
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0;
    border-block-end: 1px solid var(--_wiz-border);
    padding-block-end: var(--mth-space-3, 0.75rem);
  }

  .step-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_wiz-border);
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_wiz-subtle);
    color: var(--_wiz-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .step-btn[aria-current='step'] {
    background: var(--_wiz-accent);
    color: var(--_wiz-accent-fg);
    border-color: var(--_wiz-accent);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .step-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .step-btn:focus-visible,
  .nav-btn:focus-visible {
    outline: 2px solid var(--_wiz-focus);
    outline-offset: 2px;
  }

  .error {
    margin-block: 0;
    color: var(--_wiz-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block-start: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--_wiz-border);
  }

  .actions-nav {
    display: inline-flex;
    gap: var(--mth-space-2, 0.5rem);
    margin-inline-start: auto;
  }

  .nav-btn {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_wiz-border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--_wiz-subtle);
    color: var(--_wiz-fg);
    font: inherit;
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .nav-btn-primary {
    background: var(--_wiz-accent);
    color: var(--_wiz-accent-fg);
    border-color: var(--_wiz-accent);
  }

  .nav-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .base,
    .step-btn,
    .nav-btn {
      border-color: ButtonBorder;
    }

    .step-btn[aria-current='step'],
    .nav-btn-primary {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
