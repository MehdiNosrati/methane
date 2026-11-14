import { describe, expect, it } from 'vitest';
import '@methane/ssr/dom-shim';
import { LitElement, css, html } from 'lit';
import {
  createAngularSsrTransformStream,
  serializeAngularSsrHtml,
  transformAngularSsrResponse,
} from './index.js';

class MthAngularInput extends LitElement {
  static override properties = {
    label: { type: String },
    value: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      inline-size: 100%;
    }
  `;

  declare label: string;
  declare value: string;

  constructor() {
    super();
    this.label = '';
    this.value = '';
  }

  override render() {
    return html`<label for="ctrl">${this.label}</label><input id="ctrl" part="control" .value=${this.value}>`;
  }
}

if (!customElements.get('mth-angular-input')) {
  customElements.define('mth-angular-input', MthAngularInput);
}

describe('@methane/ssr-angular', () => {
  it('serializes Angular SSR HTML with DSD while preserving ngh/ng-version markers and hoisting links', async () => {
    const angularHtml =
      '<!doctype html><html><head><title>Ng</title></head><body>' +
      '<app-root ng-version="19.0.0" ngh="0" ng-server-context="ssr">' +
      '<mth-angular-input label="Email" value="a@b.dev"></mth-angular-input>' +
      '</app-root></body></html>';

    const res = await serializeAngularSsrHtml(angularHtml, {
      hydrationModuleUrl: '/main-hydrate.js',
    });

    expect(res.preservedAngularMarkers).toBe(true);
    expect(res.expandedTags).toEqual(['mth-angular-input']);
    expect(res.links).toHaveLength(1);
    expect(res.html).toContain('ng-version="19.0.0" ngh="0" ng-server-context="ssr"');
    expect(res.html).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(res.html).toContain('<link rel="preload" as="style" href="/_methane/styles/mth-angular-input.');
    expect(res.html).toContain('<script type="module" src="/main-hydrate.js"></script></body>');
  });

  it('supports streaming Angular SSR TransformStream and Response wrapper', async () => {
    const htmlDoc =
      '<html><head></head><body><app-root ngh="1"><mth-angular-input label="Name"></mth-angular-input></app-root></body></html>';
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(htmlDoc));
        c.close();
      },
    });

    const out = await new Response(stream.pipeThrough(createAngularSsrTransformStream())).text();
    expect(out).toContain('<template shadowroot="open" shadowrootmode="open">');

    const wrapped = await transformAngularSsrResponse(
      new Response(htmlDoc, { headers: { 'content-type': 'text/html' } }),
    );
    expect(await wrapped.text()).toContain('ngh="1"');
  });
});
