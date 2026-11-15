import { css } from 'lit';

export const tourStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_accent-fg: var(--mth-color-accent-fg, oklch(100% 0 0));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_shadow: var(--mth-shadow-lg, 0 16px 36px oklch(10% 0 0 / 0.2));
    --_z: var(--mth-z-index-modal, 500);

    display: contents;
  }

  .card {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    transform: translate3d(var(--_tour-x, 24px), var(--_tour-y, 24px), 0);
    z-index: var(--_z);
    inline-size: min(24rem, calc(100vi - 2rem));
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    background: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--_shadow);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .card[hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .icon-btn {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_muted);
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    cursor: pointer;
    font: inherit;
  }

  .icon-btn:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .progress {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_muted);
  }

  .controls {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    margin-inline-start: auto;
  }

  .btn {
    padding-block: var(--mth-space-control-block, 0.375rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background: transparent;
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .btn-primary {
    border-color: var(--_accent);
    background: var(--_accent);
    color: var(--_accent-fg);
  }

  @media (forced-colors: active) {
    .card {
      border: 2px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .btn,
    .btn-primary {
      border: 1px solid ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;
