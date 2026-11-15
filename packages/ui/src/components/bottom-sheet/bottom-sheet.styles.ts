import { css } from 'lit';

export const bottomSheetStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_border-strong: var(--mth-color-border-strong, oklch(72% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_backdrop: var(--mth-color-backdrop, oklch(12% 0.01 260 / 0.45));
    --_radius: var(--mth-radius-xl, 1rem);
    --_shadow: var(--mth-shadow-lg, 0 18px 40px oklch(10% 0 0 / 0.25));
    --_duration: var(--mth-motion-duration-normal, 200ms);
    --_easing: var(--mth-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
    --_sheet-height: 50dvh;

    display: contents;
  }

  :host([detent='collapsed']) {
    --_sheet-height: 24dvh;
  }

  :host([detent='half']) {
    --_sheet-height: 55dvh;
  }

  :host([detent='full']) {
    --_sheet-height: 92dvh;
  }

  dialog {
    margin: 0;
    margin-block-start: auto;
    margin-inline: auto;
    padding: 0;
    inline-size: min(100vi, 42rem);
    max-inline-size: 100vi;
    block-size: var(--_sheet-height);
    max-block-size: 94dvh;
    inset-block-end: 0;
    inset-inline: 0;
    border: 1px solid var(--_border);
    border-block-end: 0;
    border-start-start-radius: var(--_radius);
    border-start-end-radius: var(--_radius);
    background: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--_shadow);
    display: none;
    flex-direction: column;
    overflow: hidden;
    transition:
      block-size var(--_duration) var(--_easing),
      transform var(--_duration) var(--_easing),
      opacity var(--_duration) var(--_easing);
  }

  dialog[open] {
    display: flex;
  }

  dialog::backdrop {
    background: var(--_backdrop);
  }

  .handle-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    cursor: grab;
    touch-action: none;
    background: transparent;
    border: 0;
    inline-size: 100%;
  }

  .handle-bar:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: -2px;
  }

  .handle {
    inline-size: 2.5rem;
    block-size: 0.25rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_border-strong);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem) var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-block-end: 1px solid var(--_border);
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2rem;
    min-block-size: 2rem;
    padding: var(--mth-space-1, 0.25rem);
    border: 1px solid transparent;
    border-radius: var(--mth-radius-md, 0.375rem);
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    font: inherit;
  }

  .close-button:hover {
    color: var(--_fg);
    border-color: var(--_border);
  }

  .close-button:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .body {
    flex: 1 1 auto;
    overflow-block: auto;
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
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
      border: 2px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .handle {
      background: CanvasText;
    }

    .close-button {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
