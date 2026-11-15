import { describe, expect, it } from 'vitest';
import { renderVerifySvelteKitSsr } from './lib/ssr-harness.js';

describe('@methane-ui/verify-sveltekit', () => {
  it('renders SvelteKit SSR page with Svelte 5 bind:* props, DSD shadow roots, and <head> link hoisting', async () => {
    const result = await renderVerifySvelteKitSsr();

    expect(result.html).toContain('Methane SvelteKit SSR + Svelte 5 Binding Verification');
    expect(result.html).toContain('sveltekit-ssr@methane.dev|lit|true|false');
    expect(result.html).toContain('data-methane-canary-slot="true"');
    expect(result.html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(result.html).toContain('/assets/methane-sveltekit-hydrate.js');
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.expandedTags).toContain('mth-skip-link');
    expect(result.expandedTags).toContain('mth-visually-hidden');
    expect(result.expandedTags).toContain('mth-error-boundary');
    expect(result.expandedTags).toContain('mth-field');
    expect(result.expandedTags).toContain('mth-input');
    expect(result.expandedTags).toContain('mth-dialog');
    expect(result.expandedTags).toContain('mth-combobox');
    expect(result.expandedTags).toContain('mth-option-group');
    expect(result.expandedTags).toContain('mth-option');

    const headEnd = result.html.indexOf('</head>');
    const firstLinkIndex = result.html.indexOf('<link rel="preload" as="style"');
    expect(headEnd).toBeGreaterThan(-1);
    expect(firstLinkIndex).toBeGreaterThan(-1);
    expect(firstLinkIndex).toBeLessThan(headEnd);
  });

  it('embeds inline shadow styles in inline SSR mode', async () => {
    const result = await renderVerifySvelteKitSsr({ styles: 'inline' });
    expect(result.html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(result.html).not.toContain('rel="preload"');
  });
});
