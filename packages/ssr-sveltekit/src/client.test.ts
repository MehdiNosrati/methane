// @vitest-environment jsdom
import { initSvelteKitHydration, isSvelteKitHydrationReady } from './client.js';
import { LitElement } from 'lit';
import { describe, expect, it } from 'vitest';

describe('@methane/ssr-sveltekit/client', () => {
  it('activates @lit-labs/ssr-client hydration support', () => {
    expect(isSvelteKitHydrationReady()).toBe(true);
    expect(initSvelteKitHydration(LitElement)).toBe(true);
  });
});
