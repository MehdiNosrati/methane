import { css } from 'lit';

export const newsletterFormStyles = css`
  :host {
    --_bg: var(--mth-color-surface, oklch(99% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_accent-fg: var(--mth-color-accent-fg, oklch(100% 0 0));
    --_danger: var(--mth-color-danger, oklch(52% 0.2 25));
    --_success: var(--mth-color-success, oklch(50% 0.16 145));
    --_radius: var(--mth-radius-lg, 0.75rem);

    display: block;
    color: var(--_fg);
  }

  .base {
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    background: var(--_bg);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .description {
    margin: var(--mth-space-1, 0.25rem) 0 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_muted);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    align-items: center;
  }

  .input {
    flex: 1 1 14rem;
    min-inline-size: 0;
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--mth-color-bg, oklch(100% 0 0));
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .input:focus-visible,
  .submit:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .submit {
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 1rem);
    border: 0;
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--_accent);
    color: var(--_accent-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .submit:disabled,
  .input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .status {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_success);
  }

  .status[data-error] {
    color: var(--_danger);
  }

  .status[hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    .base,
    .input {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .submit {
      border: 1px solid ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;
