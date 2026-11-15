import { css } from 'lit';

export const notificationCenterStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_bg-subtle: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_accent-fg: var(--mth-color-accent-fg, oklch(100% 0 0));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_shadow: var(--mth-shadow-lg, 0 16px 36px oklch(10% 0 0 / 0.18));
    --_z: var(--mth-z-index-popover, 600);

    display: block;
    color: var(--_fg);
  }

  .panel {
    inline-size: min(24rem, 100vi);
    max-block-size: 28rem;
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-lg, 0.75rem);
    background: var(--_bg);
    box-shadow: var(--_shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :host(:not([inline])) .panel {
    position: fixed;
    inset-block-start: var(--mth-space-4, 1rem);
    inset-inline-end: var(--mth-space-4, 1rem);
    z-index: var(--_z);
  }

  .panel[hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-block-end: 1px solid var(--_border);
  }

  .title-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .badge {
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_accent);
    color: var(--_accent-fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .header-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .action-btn {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_muted);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .action-btn:hover {
    color: var(--_fg);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: var(--mth-space-2, 0.5rem);
    overflow-block: auto;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--_bg-subtle);
  }

  .item[data-tone='info'] {
    border-inline-start: 3px solid var(--mth-color-info, oklch(54% 0.17 250));
  }

  .item[data-tone='success'] {
    border-inline-start: 3px solid var(--mth-color-success, oklch(52% 0.17 145));
  }

  .item[data-tone='warning'] {
    border-inline-start: 3px solid var(--mth-color-warning, oklch(66% 0.17 85));
  }

  .item[data-tone='danger'] {
    border-inline-start: 3px solid var(--mth-color-danger, oklch(52% 0.2 25));
  }

  .item-body {
    min-inline-size: 0;
  }

  .item-title {
    margin: 0 0 var(--mth-space-1, 0.25rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .item-msg {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_muted);
  }

  .empty {
    padding-block: var(--mth-space-6, 1.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    text-align: center;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_muted);
  }

  @media (forced-colors: active) {
    .panel,
    .item {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }
  }
`;
