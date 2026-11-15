import { css } from 'lit';

export const calloutStyles = css`
  :host {
    --_bg: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_radius: var(--mth-radius-md, 0.5rem);

    display: block;
    color: var(--_fg);
  }

  :host([variant='info']) {
    --_bg: var(--mth-color-info-subtle, oklch(95% 0.04 250));
    --_accent: var(--mth-color-info, oklch(52% 0.16 250));
  }

  :host([variant='tip']) {
    --_bg: var(--mth-color-success-subtle, oklch(95% 0.05 145));
    --_accent: var(--mth-color-success, oklch(50% 0.16 145));
  }

  :host([variant='warning']) {
    --_bg: var(--mth-color-warning-subtle, oklch(95% 0.06 85));
    --_accent: var(--mth-color-warning, oklch(62% 0.17 85));
  }

  :host([variant='danger']) {
    --_bg: var(--mth-color-danger-subtle, oklch(95% 0.05 25));
    --_accent: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  .base {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-inline-start: 4px solid var(--_accent);
    border-radius: var(--_radius);
    background: var(--_bg);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
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
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .toggle-btn {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_fg);
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    cursor: pointer;
    font: inherit;
  }

  .toggle-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .body[hidden] {
    display: none;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  @media (forced-colors: active) {
    .base {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .toggle-btn {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
