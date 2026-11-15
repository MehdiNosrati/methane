import { css } from 'lit';

export const breadcrumbItemStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, CanvasText);
  }

  :host(:last-of-type) [part='separator'] {
    display: none;
  }

  [part='base'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  [part='link'] {
    color: var(--mth-color-fg-muted, LinkText);
    text-decoration: none;
    border-radius: var(--mth-radius-xs, 0.125rem);
  }

  [part='link']:hover {
    color: var(--mth-color-fg, CanvasText);
    text-decoration: underline;
  }

  [part='link']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  :host([current]) [part='label'],
  :host(:state(current)) [part='label'] {
    color: var(--mth-color-fg, CanvasText);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='separator'] {
    color: var(--mth-color-fg-subtle, GrayText);
    user-select: none;
  }

  @media (forced-colors: active) {
    [part='link'] {
      color: LinkText;
    }

    :host([current]) [part='label'],
    :host(:state(current)) [part='label'] {
      color: CanvasText;
    }
  }
`;
