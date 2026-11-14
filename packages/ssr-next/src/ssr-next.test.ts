import { describe, expect, it } from 'vitest';
import '@methane/ssr/dom-shim';
import { LitElement, css, html } from 'lit';
import {
  createNextSsrTransformStream,
  renderNextHtml,
  transformNextResponse,
  withMethaneNextConfig,
} from './index.js';

class MthNextButton extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      padding-inline: 1rem;
      padding-block: 0.5rem;
    }

    button {
      font-weight: 600;
    }
  `;

  declare variant: string;

  constructor() {
    super();
    this.variant = 'primary';
  }

  override render() {
    return html`<button part="control" data-variant=${this.variant}><slot></slot></button>`;
  }
}

if (!customElements.get('mth-next-button')) {
  customElements.define('mth-next-button', MthNextButton);
}

describe('@methane/ssr-next', () => {
  it('expands RSC-serialized custom elements into DSD and hoists preload links + Link headers', async () => {
    const rscHtml =
      '<!doctype html><html><head><title>Next App</title></head>' +
      '<body><main><mth-next-button variant="solid">Save</mth-next-button></main></body></html>';

    const res = await renderNextHtml(rscHtml, {
      hydrationModuleUrl: '/_next/static/methane-hydrate.js',
    });

    expect(res.expandedTags).toEqual(['mth-next-button']);
    expect(res.links).toHaveLength(1);
    expect(res.html).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(res.html).toContain(`<link rel="preload" as="style" href="${res.links[0]!.href}">`);
    expect(res.html).toContain('<script type="module" src="/_next/static/methane-hydrate.js"></script></body>');
    expect(res.linkHeader).toBe(`<${res.links[0]!.href}>; rel=preload; as=style`);
  });

  it('streams chunks through createNextSsrTransformStream and wraps Response', async () => {
    const doc = '<html><head></head><body><mth-next-button>Go</mth-next-button></body></html>';
    const input = new ReadableStream<Uint8Array>({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode(doc.slice(0, 20)));
        c.enqueue(enc.encode(doc.slice(20)));
        c.close();
      },
    });

    const streamed = await new Response(input.pipeThrough(createNextSsrTransformStream())).text();
    expect(streamed).toContain('<template shadowroot="open" shadowrootmode="open">');

    const response = await transformNextResponse(
      new Response(doc, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
    );
    expect(response.headers.get('link')).toContain('rel=preload; as=style');
    const body = await response.text();
    expect(body).toContain('<mth-next-button');
    expect(body).toContain('>Go</mth-next-button>');
  });

  it('merges transpilePackages and serverExternalPackages in withMethaneNextConfig', () => {
    const cfg = withMethaneNextConfig({
      reactStrictMode: true,
      transpilePackages: ['custom-pkg'],
    });
    expect(cfg.reactStrictMode).toBe(true);
    expect(cfg.transpilePackages).toContain('custom-pkg');
    expect(cfg.transpilePackages).toContain('@methane/ui');
    expect(cfg.serverExternalPackages).toContain('@lit-labs/ssr');
  });
});
