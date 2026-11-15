import { describe, expect, it } from 'vitest';
import '@methane/ssr/dom-shim';
import { LitElement, css, html } from 'lit';
import {
  createMethaneAstroIntegration,
  createMethaneAstroMiddleware,
  createMethaneAstroRenderer,
  isMethaneAstroComponent,
} from './index.js';

class MthAstroCard extends LitElement {
  static override properties = {
    title: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      inline-size: 100%;
      padding-inline: 1.25rem;
      padding-block: 1rem;
    }
  `;

  declare title: string;

  constructor() {
    super();
    this.title = 'Astro';
  }

  override render() {
    return html`<section part="base"><h3>${this.title}</h3><slot></slot></section>`;
  }
}

if (!customElements.get('mth-astro-card')) {
  customElements.define('mth-astro-card', MthAstroCard);
}

describe('@methane/ssr-astro', () => {
  it('registers renderer and client script via createMethaneAstroIntegration', () => {
    const added: Array<{ name: string; serverEntrypoint: string }> = [];
    const scripts: Array<{ stage: string; content: string }> = [];

    const integration = createMethaneAstroIntegration();
    integration.hooks['astro:config:setup']({
      addRenderer: (r) => added.push(r),
      injectScript: (stage, content) => scripts.push({ stage, content }),
    });

    expect(added).toHaveLength(1);
    expect(added[0]!.name).toBe('@methane/ssr-astro');
    expect(scripts[0]!.stage).toBe('page');
    expect(scripts[0]!.content).toContain('@methane/ssr-astro/client');
  });

  it('renders static markup for Astro islands and hoists stylesheet preloads in middleware', async () => {
    expect(isMethaneAstroComponent(MthAstroCard)).toBe(true);
    expect(isMethaneAstroComponent({ tagName: 'mth-astro-card' })).toBe(true);

    const renderer = createMethaneAstroRenderer();
    const island = await renderer.renderToStaticMarkup(
      { tagName: 'mth-astro-card' },
      { title: 'Island' },
      { default: '<p>Content</p>' },
    );
    expect(island.html).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(island.html).toContain('Island<!--/lit-part--></h3>');
    expect(island.links).toHaveLength(1);

    const middleware = createMethaneAstroMiddleware();
    const doc =
      '<!doctype html><html><head></head><body><mth-astro-card title="Page">Hi</mth-astro-card></body></html>';
    const res = await middleware(
      {},
      async () => new Response(doc, { headers: { 'content-type': 'text/html' } }),
    );
    const out = await res.text();
    expect(out).toContain('<link rel="preload" as="style" href="/_methane/styles/mth-astro-card.');
    expect(out).toContain('<template shadowroot="open" shadowrootmode="open">');
  });
});
