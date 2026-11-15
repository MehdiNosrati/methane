import { css } from 'lit';

export const formulaBarStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    --_fb-bg: var(--mth-color-surface, Canvas);
    --_fb-subtle: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.22 0.01 260)));
    --_fb-border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_fb-focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_fb-accent: var(--mth-color-accent, oklch(0.55 0.2 250));
    --_fb-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_fb-muted: var(--mth-color-fg-muted, GrayText);
    --_fb-radius: var(--mth-radius-md, 0.375rem);
  }

  .base {
    display: flex;
    align-items: stretch;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-2, 0.5rem);
    background: var(--_fb-bg);
    border: 1px solid var(--_fb-border);
    border-radius: var(--_fb-radius);
  }

  :host(:state(invalid)) .base {
    border-color: var(--_fb-danger);
  }

  :host(:state(disabled)) .base {
    opacity: 0.6;
  }

  .address {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 4rem;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    background: var(--_fb-subtle);
    border: 1px solid var(--_fb-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .fx {
    display: inline-flex;
    align-items: center;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    color: var(--_fb-accent);
    font-weight: var(--mth-font-weight-semibold, 600);
    padding-inline: var(--mth-space-1, 0.25rem);
  }

  .formula-input {
    flex: 1 1 auto;
    min-inline-size: 0;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_fb-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_fb-bg);
    color: inherit;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .formula-input:focus-visible,
  .commit-btn:focus-visible {
    outline: 2px solid var(--_fb-focus);
    outline-offset: 2px;
  }

  .commit-btn {
    appearance: none;
    border: 1px solid var(--_fb-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_fb-subtle);
    color: inherit;
    font: inherit;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    cursor: pointer;
  }

  .fallback-slot {
    display: none;
  }

  @media (forced-colors: active) {
    .base,
    .address,
    .formula-input,
    .commit-btn {
      border-color: ButtonBorder;
    }

    .formula-input:focus-visible,
    .commit-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
