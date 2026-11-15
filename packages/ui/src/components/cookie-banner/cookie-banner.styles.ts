import { css } from 'lit';

export const cookieBannerStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_accent-fg: var(--mth-color-accent-fg, oklch(100% 0 0));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_shadow: var(--mth-shadow-lg, 0 14px 30px oklch(10% 0 0 / 0.18));
    --_z: var(--mth-z-index-toast, 700);

    display: contents;
  }

  .banner {
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: var(--_z);
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-6, 1.5rem);
    background: var(--_bg);
    color: var(--_fg);
    border-block-start: 1px solid var(--_border);
    box-shadow: var(--_shadow);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .banner[hidden] {
    display: none;
  }

  :host([position='top']) .banner {
    inset-block-start: 0;
    inset-block-end: auto;
    border-block-start: 0;
    border-block-end: 1px solid var(--_border);
  }

  :host([position='floating']) .banner {
    inset-block-end: var(--mth-space-4, 1rem);
    inset-inline-start: var(--mth-space-4, 1rem);
    inset-inline-end: auto;
    inline-size: min(28rem, calc(100vi - 2rem));
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-lg, 0.75rem);
  }

  .heading {
    margin: 0 0 var(--mth-space-1, 0.25rem);
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .copy {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_muted);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .preferences {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-2, 0.5rem);
    border-block: 1px solid var(--_border);
  }

  .preferences[hidden] {
    display: none;
  }

  .pref-item {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn {
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.875rem);
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

  .btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .banner {
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
