import { describe, expect, it } from 'vitest';
import '@methane-ui/ssr/dom-shim';
import { LitElement, css, html } from 'lit';
import { createMethaneHandle, transformSvelteKitHtml } from './index.js';

class MthSvelteSwitch extends LitElement {
  static override properties = {
    checked: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      inline-size: 2.5rem;
      block-size: 1.5rem;
    }
  `;

  declare checked: boolean;

  constructor() {
    super();
    this.checked = false;
  }

  override render() {
    return html`<button role="switch" aria-checked=${this.checked ? 'true' : 'false'} part="control"></button>`;
  }
}

if (!customElements.get('mth-svelte-switch')) {
  customElements.define('mth-svelte-switch', MthSvelteSwitch);
}

describe('@methane-ui/ssr-sveltekit', () => {
  it('transforms streamed SvelteKit page chunks via handle() and hoists <link> preloads', async () => {
    const handle = createMethaneHandle({
      hydrationModuleUrl: '/_app/methane-hydrate.js',
    });

    const fullHtml =
      '<!doctype html><html><head><title>SK</title></head>' +
      '<body><mth-svelte-switch checked></mth-svelte-switch></body></html>';

    const response = await handle({
      event: { url: new URL('https://example.com/') },
      resolve: async (_event, opts) => {
        const chunk1 = await opts!.transformPageChunk!({
          html: fullHtml.slice(0, 48),
          done: false,
        });
        expect(chunk1).toBe('');

        const chunk2 = await opts!.transformPageChunk!({
          html: fullHtml.slice(48),
          done: true,
        });
        return new Response(chunk2, {
          headers: { 'content-type': 'text/html' },
        });
      },
    });

    const htmlOut = await response.text();
    expect(htmlOut).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(htmlOut).toContain('aria-checked="true"');
    expect(htmlOut).toContain('<link rel="preload" as="style" href="/_methane/styles/mth-svelte-switch.');
    expect(htmlOut).toContain('<script type="module" src="/_app/methane-hydrate.js"></script></body>');
  });

  it('transforms static SvelteKit HTML directly', async () => {
    const res = await transformSvelteKitHtml(
      '<html><head></head><body><mth-svelte-switch></mth-svelte-switch></body></html>',
    );
    expect(res.expandedTags).toEqual(['mth-svelte-switch']);
    expect(res.links).toHaveLength(1);
  });
});
