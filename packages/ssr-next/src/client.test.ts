// @vitest-environment jsdom
import { initNextHydration, isNextHydrationReady } from './client.js';
import { LitElement } from 'lit';
import { describe, expect, it } from 'vitest';

describe('@methane/ssr-next/client', () => {
  it('registers @lit-labs/ssr-client hydration support', () => {
    expect(isNextHydrationReady()).toBe(true);
    expect(initNextHydration(LitElement)).toBe(true);
  });
});
