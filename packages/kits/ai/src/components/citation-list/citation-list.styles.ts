import { css } from 'lit';

export const citationListStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_cl-bg: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    --_cl-bg-hover: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
    --_cl-fg: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    --_cl-muted: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
    --_cl-border: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    --_cl-focus: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    --_cl-accent: var(--mth-color-accent, light-dark(oklch(52% 0.2 255), oklch(70% 0.16 255)));
    --_cl-radius: var(--mth-radius-md, 0.5rem);
  }

  :host([hidden]) {
    display: none;
  }

  .list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  :host([orientation='vertical']) .list {
    flex-direction: column;
  }

  .item {
    display: inline-flex;
  }

  .citation {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_cl-border);
    border-radius: var(--_cl-radius);
    background-color: var(--_cl-bg);
    color: var(--_cl-fg);
    text-decoration: none;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
    text-align: start;
  }

  .citation:hover {
    background-color: var(--_cl-bg-hover);
    border-color: var(--_cl-accent);
  }

  .citation:focus-visible {
    outline: 2px solid var(--_cl-focus);
    outline-offset: 2px;
  }

  .citation[data-selected] {
    border-color: var(--_cl-accent);
  }

  .title {
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .domain {
    color: var(--_cl-muted);
  }

  @media (forced-colors: active) {
    .citation {
      border-color: ButtonText;
      background-color: Canvas;
      color: ButtonText;
    }

    .citation[data-selected] {
      forced-color-adjust: none;
      border-color: Highlight;
      background-color: Highlight;
      color: HighlightText;
    }

    .citation[data-selected] .domain {
      color: HighlightText;
    }

    .citation:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
