import { css } from '@methane-ui/core';

export const breadcrumbPathStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-muted);
  }

  [part='list'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  [part='item'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1);
  }

  [part='link'] {
    color: var(--mth-color-fg-muted);
    text-decoration: none;
    border-radius: var(--mth-radius-sm);
    padding-inline: var(--mth-space-1);
  }

  a[part='link']:hover {
    color: var(--mth-color-fg);
    text-decoration: underline;
  }

  [part='link'][aria-current='page'] {
    color: var(--mth-color-fg);
    font-weight: var(--mth-font-weight-medium);
  }

  [part='ellipsis'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 1.5rem;
    block-size: 1.5rem;
    padding-inline: var(--mth-space-1);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background-color: var(--mth-color-surface);
    color: var(--mth-color-fg);
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
  }

  [part='ellipsis']:hover {
    background-color: var(--mth-color-bg-subtle);
  }

  [part='link']:focus-visible,
  [part='ellipsis']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  [part='separator'] {
    color: var(--mth-color-fg-subtle);
    user-select: none;
    padding-inline: var(--mth-space-1);
  }

  @media (forced-colors: active) {
    [part='link'] {
      color: LinkText;
    }

    [part='link'][aria-current='page'] {
      color: CanvasText;
    }

    [part='ellipsis'] {
      border-color: ButtonText;
      color: ButtonText;
      background-color: ButtonFace;
    }
  }
`;
