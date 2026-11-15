import { css } from 'lit';

export const toolCallStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_tc-bg: var(--mth-color-surface, oklch(99% 0 0));
    --_tc-subtle: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_tc-fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_tc-muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_tc-border: var(--mth-color-border, oklch(86% 0.01 260));
    --_tc-focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_tc-radius: var(--mth-radius-md, 0.5rem);
  }

  :host([hidden]) {
    display: none;
  }

  .card {
    border: 1px solid var(--_tc-border);
    border-radius: var(--_tc-radius);
    background-color: var(--_tc-bg);
    color: var(--_tc-fg);
  }

  .trigger {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: 100%;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: start;
    cursor: pointer;
  }

  .trigger:focus-visible {
    outline: 2px solid var(--_tc-focus);
    outline-offset: -2px;
  }

  .name {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-weight: var(--mth-font-weight-medium, 500);
    flex: 1;
  }

  .duration {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_tc-muted);
  }

  .details {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--_tc-border);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .details[hidden] {
    display: none;
  }

  .section-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--_tc-muted);
    margin-block-end: var(--mth-space-1, 0.25rem);
  }

  .code {
    margin: 0;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_tc-subtle);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    overflow-inline: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
