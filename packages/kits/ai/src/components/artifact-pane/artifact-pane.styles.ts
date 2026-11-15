import { css } from 'lit';

export const artifactPaneStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_ap-bg: var(--mth-color-surface-raised, oklch(100% 0 0));
    --_ap-subtle: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_ap-fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_ap-muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_ap-border: var(--mth-color-border, oklch(86% 0.01 260));
    --_ap-accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_ap-focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_ap-radius: var(--mth-radius-lg, 0.75rem);
  }

  :host([hidden]) {
    display: none;
  }

  .pane {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--_ap-border);
    border-radius: var(--_ap-radius);
    background-color: var(--_ap-bg);
    color: var(--_ap-fg);
    overflow: hidden;
  }

  .pane[hidden] {
    display: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-block-end: 1px solid var(--_ap-border);
    background-color: var(--_ap-subtle);
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    min-inline-size: 0;
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .tabs {
    display: inline-flex;
    border: 1px solid var(--_ap-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    overflow: hidden;
  }

  .tab {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 0;
    background: transparent;
    color: var(--_ap-muted);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .tab[aria-selected='true'] {
    background-color: var(--_ap-bg);
    color: var(--_ap-fg);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .tab:focus-visible,
  .version-select:focus-visible {
    outline: 2px solid var(--_ap-focus);
    outline-offset: -2px;
  }

  .version-select {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_ap-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--_ap-bg);
    color: var(--_ap-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .body {
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
  }

  .code {
    margin: 0;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    overflow-inline: auto;
    white-space: pre-wrap;
  }

  .preview-body {
    line-height: var(--mth-line-height-normal, 1.5);
  }
`;
