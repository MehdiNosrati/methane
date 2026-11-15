import { css } from 'lit';

export const dialogStyles = css`
  :host {
    display: contents;
    --_dialog-bg: var(--mth-color-surface-raised, Canvas);
    --_dialog-fg: var(--mth-color-fg, CanvasText);
    --_dialog-muted: var(--mth-color-fg-muted, GrayText);
    --_dialog-border: var(--mth-color-border, ButtonBorder);
    --_dialog-accent: var(--mth-color-accent, Highlight);
    --_dialog-accent-fg: var(--mth-color-accent-fg, HighlightText);
    --_dialog-backdrop: var(--mth-color-backdrop, oklch(0 0 0 / 0.45));
    --_dialog-radius: var(--mth-radius-lg, 0.75rem);
    --_dialog-shadow: var(--mth-shadow-lg, 0 12px 32px oklch(0 0 0 / 0.2));
    --_dialog-pad: calc(var(--mth-space-5, 1.25rem) * var(--mth-density, 1));
  }

  dialog.base {
    border: 1px solid var(--_dialog-border);
    border-radius: var(--_dialog-radius);
    background: var(--_dialog-bg);
    color: var(--_dialog-fg);
    box-shadow: var(--_dialog-shadow);
    padding-block: 0;
    padding-inline: 0;
    inline-size: min(32rem, calc(100vi - 2rem));
    max-inline-size: calc(100vi - 2rem);
    max-block-size: calc(100vb - 2rem);
    overflow: hidden;
  }

  dialog.base:not([open]):not([data-mth-open='true']) {
    display: none;
  }

  dialog.base::backdrop {
    background: var(--_dialog-backdrop);
  }

  dialog.base[data-mth-top-layer-fallback][data-mth-open='true'] {
    position: fixed;
    inset-block: 0;
    inset-inline: 0;
    margin: auto;
    z-index: var(--mth-z-index-modal, 400);
    display: block;
  }

  .popup {
    display: flex;
    flex-direction: column;
    max-block-size: calc(100vb - 2rem);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--_dialog-pad);
    padding-inline: var(--_dialog-pad);
    border-block-end: 1px solid var(--_dialog-border);
  }

  .title {
    margin-block: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2rem;
    block-size: 2rem;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_dialog-muted);
    cursor: pointer;
    padding-block: 0;
    padding-inline: 0;
    font: inherit;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .close-btn:hover {
    background: var(--mth-color-bg-muted, light-dark(oklch(0.925 0.01 262), oklch(0.24 0.016 262)));
    color: var(--_dialog-fg);
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  .body {
    padding-block: var(--_dialog-pad);
    padding-inline: var(--_dialog-pad);
    overflow-block: auto;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .description {
    margin-block: 0;
    color: var(--_dialog-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .prompt-label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .prompt-input {
    inline-size: 100%;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border-strong, var(--_dialog-border));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, Canvas);
    color: var(--_dialog-fg);
    font: inherit;
    box-shadow: var(--mth-shadow-xs, none);
    box-sizing: border-box;
  }

  .prompt-input:focus-visible {
    outline: none;
    border-color: var(--mth-color-border-focus, Highlight);
    box-shadow: 0 0 0 3px oklch(from var(--mth-color-border-focus, Highlight) l c h / 0.22);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--_dialog-pad);
    padding-inline: var(--_dialog-pad);
    border-block-start: 1px solid var(--_dialog-border);
  }

  .action-btn {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-radius: var(--mth-radius-md, 0.5rem);
    border: 1px solid var(--mth-color-border-strong, var(--_dialog-border));
    background: var(--mth-color-surface, transparent);
    color: var(--_dialog-fg);
    font: inherit;
    font-weight: var(--mth-font-weight-semibold, 600);
    box-shadow: var(--mth-shadow-xs, none);
    cursor: pointer;
  }

  .action-btn.primary {
    background: var(--_dialog-accent);
    border-color: oklch(from var(--_dialog-accent) calc(l - 0.06) c h / 0.5);
    color: var(--_dialog-accent-fg);
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs, none);
  }

  @media (prefers-reduced-motion: reduce) {
    .close-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    dialog.base {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }

    .action-btn.primary {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
