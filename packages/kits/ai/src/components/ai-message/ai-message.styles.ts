import { css } from 'lit';

export const aiMessageStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_msg-bg: var(--mth-color-surface, oklch(99% 0 0));
    --_msg-fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_msg-muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_msg-border: var(--mth-color-border, oklch(86% 0.01 260));
    --_msg-accent-bg: var(--mth-color-accent-subtle, oklch(95% 0.03 255));
    --_msg-subtle-bg: var(--mth-color-bg-subtle, oklch(96% 0.005 260));
    --_msg-accent: var(--mth-color-accent, oklch(52% 0.2 255));
    --_msg-radius: var(--mth-radius-lg, 0.75rem);
  }

  :host([hidden]) {
    display: none;
  }

  .base {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_msg-border);
    border-radius: var(--_msg-radius);
    background-color: var(--_msg-bg);
    color: var(--_msg-fg);
  }

  :host([role='user']) .base {
    background-color: var(--_msg-accent-bg);
  }

  :host([role='system']) .base {
    background-color: var(--_msg-subtle-bg);
  }

  .avatar-col {
    display: flex;
    align-items: flex-start;
    padding-block-start: var(--mth-space-1, 0.25rem);
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    min-inline-size: 0;
  }

  .header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .author {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .timestamp {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_msg-muted);
    margin-inline-start: auto;
  }

  .content {
    font-size: var(--mth-font-size-md, 1rem);
    line-height: var(--mth-line-height-normal, 1.5);
    overflow-wrap: anywhere;
  }

  .content p {
    margin-block: 0 var(--mth-space-2, 0.5rem);
  }

  .content p:last-child {
    margin-block-end: 0;
  }

  .content code {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: 0.9em;
    padding-block: 0.1em;
    padding-inline: 0.35em;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_msg-subtle-bg);
  }

  .content a {
    color: var(--_msg-accent);
    text-decoration: underline;
  }

  .cursor {
    display: inline-block;
    inline-size: 0.5rem;
    block-size: 1em;
    margin-inline-start: var(--mth-space-1, 0.25rem);
    vertical-align: text-bottom;
    background-color: var(--_msg-accent);
    border-radius: var(--mth-radius-xs, 0.125rem);
    animation: mth-ai-cursor 1s steps(2, start) infinite;
  }

  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  @keyframes mth-ai-cursor {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.2;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
    }
  }
`;
