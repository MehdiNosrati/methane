import { css } from 'lit';

export const fullscreenOverlayStyles = css`
  :host {
    --_bg: var(--mth-color-bg, oklch(100% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_duration: var(--mth-motion-duration-normal, 200ms);
    --_easing: var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));

    display: contents;
  }

  dialog {
    margin: 0;
    padding: 0;
    inset: 0;
    inline-size: 100vi;
    block-size: 100dvh;
    max-inline-size: none;
    max-block-size: none;
    border: 0;
    background: var(--_bg);
    color: var(--_fg);
    display: none;
    flex-direction: column;
    overflow: hidden;
    transition: opacity var(--_duration) var(--_easing);
  }

  dialog[open] {
    display: flex;
  }

  dialog::backdrop {
    background: var(--mth-color-backdrop, oklch(12% 0.01 260 / 0.55));
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-6, 1.5rem);
    border-block-end: 1px solid var(--_border);
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    min-block-size: 2.25rem;
    padding: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    font: inherit;
  }

  .close-button:hover {
    color: var(--_fg);
  }

  .close-button:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .body {
    flex: 1 1 auto;
    overflow-block: auto;
    padding-block: var(--mth-space-6, 1.5rem);
    padding-inline: var(--mth-space-6, 1.5rem);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-6, 1.5rem);
    border-block-start: 1px solid var(--_border);
  }

  .footer[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    dialog {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    dialog {
      background: Canvas;
      color: CanvasText;
    }

    .close-button {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
