import { css } from 'lit';

export const linkStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    --_link-fg: var(--mth-color-accent, LinkText);
    --_link-fg-hover: var(--mth-color-accent-hover, LinkText);
    --_link-decoration: underline;
  }

  :host([underline='hover']) {
    --_link-decoration: none;
  }

  :host([underline='none']) {
    --_link-decoration: none;
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_link-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-weight: var(--mth-font-weight-medium, 500);
    text-decoration: var(--_link-decoration);
    text-underline-offset: 0.2em;
    cursor: pointer;
    border-radius: var(--mth-radius-xs, 0.125rem);
  }

  :host([underline='hover']) [part='control']:hover:not([aria-disabled='true']) {
    text-decoration: underline;
  }

  [part='control']:hover:not([aria-disabled='true']) {
    color: var(--_link-fg-hover);
  }

  [part='control']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  :host(:state(disabled)) [part='control'],
  :host([disabled]) [part='control'] {
    opacity: 0.5;
    cursor: not-allowed;
    text-decoration: none;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (forced-colors: active) {
    [part='control'] {
      color: LinkText;
    }

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      color: GrayText;
      opacity: 1;
    }
  }
`;
