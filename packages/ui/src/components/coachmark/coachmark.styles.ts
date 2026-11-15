import { css } from 'lit';

export const coachmarkStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_accent-fg: var(--mth-color-accent-fg, oklch(100% 0 0));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_shadow: var(--mth-shadow-lg, 0 14px 30px oklch(10% 0 0 / 0.18));
    --_z: var(--mth-z-index-popover, 600);

    display: contents;
  }

  .surface {
    position: fixed;
    z-index: var(--_z);
    inline-size: min(20rem, calc(100vi - 2rem));
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    background: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--_shadow);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .surface[hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .title-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    min-inline-size: 0;
  }

  .beacon {
    inline-size: 0.625rem;
    block-size: 0.625rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_accent);
    flex-shrink: 0;
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .close-btn {
    border: 1px solid transparent;
    background: transparent;
    color: var(--_muted);
    border-radius: var(--mth-radius-sm, 0.25rem);
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    cursor: pointer;
    font: inherit;
  }

  .close-btn:focus-visible {
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
    gap: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
  }

  .progress {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_muted);
  }

  .actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    margin-inline-start: auto;
  }

  .dismiss-btn {
    padding-block: var(--mth-space-control-block, 0.375rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 0;
    border-radius: var(--mth-radius-md, 0.375rem);
    background: var(--_accent);
    color: var(--_accent-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .dismiss-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .arrow {
    position: absolute;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    background: var(--_bg);
    border: 1px solid var(--_border);
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (forced-colors: active) {
    .surface {
      border: 2px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .dismiss-btn {
      border: 1px solid ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;
