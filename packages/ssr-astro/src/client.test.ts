// @vitest-environment jsdom
import { initAstroHydration, isAstroHydrationReady } from './client.js';
import { LitElement } from 'lit';
import { describe, expect, it } from 'vitest';

describe('@methane-ui/ssr-astro/client', () => {
  it('activates @lit-labs/ssr-client hydration support for Astro islands', () => {
    expect(isAstroHydrationReady()).toBe(true);
    expect(initAstroHydration(LitElement)).toBe(true);
  });
});
