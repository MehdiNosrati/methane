import { css } from 'lit';

export const bannerStyles = css`
  :host {
    --_bg: var(--mth-color-info-subtle, oklch(94% 0.04 250));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_accent: var(--mth-color-info, oklch(52% 0.16 250));
    --_border: var(--mth-color-border, oklch(85% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_z: var(--mth-z-index-sticky, 200);

    display: block;
    color: var(--_fg);
  }

  :host([dismissed]) {
    display: none;
  }

  :host([sticky]) {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--_z);
  }

  :host([variant='success']) {
    --_bg: var(--mth-color-success-subtle, oklch(94% 0.05 145));
    --_accent: var(--mth-color-success, oklch(50% 0.16 145));
  }

  :host([variant='warning']) {
    --_bg: var(--mth-color-warning-subtle, oklch(95% 0.06 85));
    --_accent: var(--mth-color-warning, oklch(62% 0.17 85));
  }

  :host([variant='danger']) {
    --_bg: var(--mth-color-danger-subtle, oklch(94% 0.05 25));
    --_accent: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  :host([variant='neutral']) {
    --_bg: var(--mth-color-bg-subtle, oklch(95% 0.005 260));
    --_accent: var(--mth-color-fg-muted, oklch(48% 0.01 260));
  }

  .base {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    background: var(--_bg);
    border-block-end: 1px solid var(--_border);
    border-inline-start: 3px solid var(--_accent);
  }

  .leading {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .heading {
    font-weight: var(--mth-font-weight-semibold, 600);
    margin-inline-end: var(--mth-space-2, 0.5rem);
  }

  .content {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .trailing {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    flex-shrink: 0;
  }

  .close-btn {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_fg);
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    cursor: pointer;
    font: inherit;
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .close-btn {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
