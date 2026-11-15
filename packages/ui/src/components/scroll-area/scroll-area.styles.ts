import { css } from '@methane/core';

export const scrollAreaStyles = css`
  :host {
    display: block;
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
  }

  [part='base'] {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
  }

  [part='viewport'] {
    inline-size: 100%;
    block-size: 100%;
    overflow-block: auto;
    overflow-inline: hidden;
    scrollbar-width: none;
    outline: none;
  }

  :host([orientation='horizontal']) [part='viewport'] {
    overflow-block: hidden;
    overflow-inline: auto;
  }

  :host([orientation='both']) [part='viewport'] {
    overflow-block: auto;
    overflow-inline: auto;
  }

  [part='viewport']::-webkit-scrollbar {
    display: none;
  }

  [part='viewport']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: -2px;
  }

  [part='content'] {
    min-inline-size: 100%;
    display: block;
  }

  [part='scrollbar-y'],
  [part='scrollbar-x'] {
    position: absolute;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--mth-motion-duration-fast) var(--mth-motion-easing-standard);
  }

  [part='scrollbar-y'] {
    inset-block-start: var(--mth-space-1);
    inset-block-end: var(--mth-space-1);
    inset-inline-end: var(--mth-space-1);
    inline-size: 0.375rem;
  }

  [part='scrollbar-x'] {
    inset-inline-start: var(--mth-space-1);
    inset-inline-end: var(--mth-space-1);
    inset-block-end: var(--mth-space-1);
    block-size: 0.375rem;
  }

  [part='thumb-y'],
  [part='thumb-x'] {
    border-radius: var(--mth-radius-full);
    background-color: var(--mth-color-border-strong);
  }

  [part='thumb-y'] {
    inline-size: 100%;
    block-size: 40%;
  }

  [part='thumb-x'] {
    block-size: 100%;
    inline-size: 40%;
  }

  :host([type='always']) [part='scrollbar-y'],
  :host([type='always']) [part='scrollbar-x'],
  :host([type='auto']) [part='scrollbar-y'],
  :host([type='auto']) [part='scrollbar-x'],
  :host([type='hover']:hover) [part='scrollbar-y'],
  :host([type='hover']:hover) [part='scrollbar-x'],
  [part='base'][data-scrolling='true'] [part='scrollbar-y'],
  [part='base'][data-scrolling='true'] [part='scrollbar-x'] {
    opacity: 1;
  }

  :host([orientation='horizontal']) [part='scrollbar-y'] {
    display: none;
  }

  :host([orientation='vertical']) [part='scrollbar-x'] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='scrollbar-y'],
    [part='scrollbar-x'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='thumb-y'],
    [part='thumb-x'] {
      background-color: Highlight;
    }
  }
`;
