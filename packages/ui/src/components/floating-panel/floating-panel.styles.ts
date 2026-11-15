import { css } from 'lit';

export const floatingPanelStyles = css`
  :host {
    --_bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_bg-subtle: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_shadow: var(--mth-shadow-lg, 0 18px 40px oklch(10% 0 0 / 0.2));
    --_z: var(--mth-z-index-popover, 600);

    display: contents;
  }

  .panel {
    position: fixed;
    inset-block-start: var(--_panel-y, 24px);
    inset-inline-start: var(--_panel-x, 24px);
    z-index: var(--_z);
    inline-size: min(22rem, calc(100vi - 2rem));
    max-block-size: calc(100dvh - 2rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    background: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--_shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel[hidden] {
    display: none;
  }

  :host([dock='end']) .panel {
    inset-block: 0;
    inset-inline-start: auto;
    inset-inline-end: 0;
    inline-size: min(24rem, 90vi);
    max-block-size: 100dvh;
    border-radius: 0;
    border-block: 0;
    border-inline-end: 0;
  }

  :host([dock='start']) .panel {
    inset-block: 0;
    inset-inline-start: 0;
    inset-inline-end: auto;
    inline-size: min(24rem, 90vi);
    max-block-size: 100dvh;
    border-radius: 0;
    border-block: 0;
    border-inline-start: 0;
  }

  :host([dock='bottom']) .panel {
    inset-block-start: auto;
    inset-block-end: 0;
    inset-inline: 0;
    inline-size: 100vi;
    max-block-size: 45dvh;
    border-radius: 0;
    border-block-end: 0;
    border-inline: 0;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background: var(--_bg-subtle);
    border-block-end: 1px solid var(--_border);
  }

  :host([minimized]) .header {
    border-block-end: 0;
  }

  .drag-handle {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    min-inline-size: 0;
    cursor: grab;
    touch-action: none;
    border-radius: var(--mth-radius-sm, 0.25rem);
  }

  .drag-handle:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .controls {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    flex-shrink: 0;
  }

  .control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .control-btn:hover {
    color: var(--_fg);
    border-color: var(--_border);
  }

  .control-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .body {
    flex: 1 1 auto;
    overflow-block: auto;
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
  }

  .body[hidden],
  .footer[hidden] {
    display: none;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--_border);
  }

  @media (forced-colors: active) {
    .panel {
      border: 2px solid CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    .control-btn {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
