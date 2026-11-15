import { css } from 'lit';

export const toastStyles = css`
  :host {
    display: contents;
    --_toast-bg: var(--mth-color-surface-raised, Canvas);
    --_toast-fg: var(--mth-color-fg, CanvasText);
    --_toast-muted: var(--mth-color-fg-muted, GrayText);
    --_toast-border: var(--mth-color-border, ButtonBorder);
    --_toast-accent: var(--mth-color-info, oklch(0.58 0.16 250));
    --_toast-radius: var(--mth-radius-md, 0.5rem);
    --_toast-shadow: var(--mth-shadow-lg, 0 12px 28px oklch(0 0 0 / 0.18));
  }

  :host([variant='success']) {
    --_toast-accent: var(--mth-color-success, oklch(0.58 0.17 150));
  }

  :host([variant='warning']) {
    --_toast-accent: var(--mth-color-warning, oklch(0.72 0.17 75));
  }

  :host([variant='danger']) {
    --_toast-accent: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .region {
    position: fixed;
    z-index: var(--mth-z-index-toast, 700);
    inset-block-end: var(--mth-space-4, 1rem);
    inset-inline-end: var(--mth-space-4, 1rem);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    max-inline-size: min(26rem, calc(100vi - 2rem));
    pointer-events: none;
  }

  :host([placement='top-start']) .region {
    inset-block-end: auto;
    inset-block-start: var(--mth-space-4, 1rem);
    inset-inline-end: auto;
    inset-inline-start: var(--mth-space-4, 1rem);
  }

  :host([placement='top-center']) .region {
    inset-block-end: auto;
    inset-block-start: var(--mth-space-4, 1rem);
    inset-inline: 0;
    margin-inline: auto;
  }

  :host([placement='top-end']) .region {
    inset-block-end: auto;
    inset-block-start: var(--mth-space-4, 1rem);
    inset-inline-start: auto;
    inset-inline-end: var(--mth-space-4, 1rem);
  }

  :host([placement='bottom-start']) .region {
    inset-block-start: auto;
    inset-block-end: var(--mth-space-4, 1rem);
    inset-inline-end: auto;
    inset-inline-start: var(--mth-space-4, 1rem);
  }

  :host([placement='bottom-center']) .region {
    inset-block-start: auto;
    inset-block-end: var(--mth-space-4, 1rem);
    inset-inline: 0;
    margin-inline: auto;
  }

  .card {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_toast-border);
    border-inline-start: 4px solid var(--_toast-accent);
    border-radius: var(--_toast-radius);
    background: var(--_toast-bg);
    color: var(--_toast-fg);
    box-shadow: var(--_toast-shadow);
    margin-block: 0;
    margin-inline: 0;
    box-sizing: border-box;
  }

  .card[data-tone='success'] {
    border-inline-start-color: var(--mth-color-success, oklch(0.58 0.17 150));
  }

  .card[data-tone='warning'] {
    border-inline-start-color: var(--mth-color-warning, oklch(0.72 0.17 75));
  }

  .card[data-tone='danger'] {
    border-inline-start-color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .card[hidden] {
    display: none;
  }

  .content {
    flex: 1 1 auto;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .title {
    font-weight: var(--mth-font-weight-semibold, 600);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .message {
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_toast-muted);
  }

  .close-btn {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_toast-muted);
    cursor: pointer;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .card {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }

    .close-btn:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
