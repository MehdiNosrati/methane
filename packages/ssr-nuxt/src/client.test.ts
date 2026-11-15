// @vitest-environment jsdom
import { createMethaneNuxtPlugin, initNuxtHydration } from './client.js';
import { LitElement } from 'lit';
import { describe, expect, it } from 'vitest';

describe('@methane/ssr-nuxt/client', () => {
  it('exposes Nuxt client plugin initializing @lit-labs/ssr-client hydration', () => {
    const plugin = createMethaneNuxtPlugin();
    expect(plugin.setup().hydrationReady).toBe(true);
    expect(initNuxtHydration(LitElement)).toBe(true);
  });
});
