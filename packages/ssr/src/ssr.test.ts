// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import './dom-shim.js';
import { LitElement, css, html } from 'lit';
import {
  CRITICAL_SHELL_MAX_BYTES,
  collectStylesheetLinks,
  computeCssHash,
  createSsrTransformStream,
  hoistStylesheetLinks,
  renderToStream,
  renderToString,
  renderWithMetadata,
  transformHtmlDsd,
  utf8ByteLength,
} from './index.js';

class MthSsrBadge extends LitElement {
  static override properties = {
    tone: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      padding-inline: 0.75rem;
      padding-block: 0.25rem;
      border-radius: 9999px;
      background: var(--_bg, oklch(0.95 0.02 250));
      color: var(--_fg, oklch(0.25 0.04 250));
    }

    .label {
      font-weight: 600;
      letter-spacing: 0.01em;
    }
  `;

  tone = 'info';

  override render() {
    return html`<span part="base" class="label" data-tone=${this.tone}><slot></slot></span>`;
  }
}

customElements.define('mth-ssr-badge', MthSsrBadge);

class MthSsrAsyncCard extends LitElement {
  static override properties = {
    heading: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      inline-size: 100%;
      padding-inline: 1rem;
      padding-block: 1rem;
    }
  `;

  declare heading: string;

  constructor() {
    super();
    this.heading = 'Card';
  }

  override render() {
    return html`
      <article part="base">
        <h2>${this.heading}</h2>
        <div part="body"><slot></slot></div>
      </article>
    `;
  }
}

customElements.define('mth-ssr-async-card', MthSsrAsyncCard);

describe('@methane/ssr', () => {
  it('renders linked mode by default with content-hashed <link> and < 1 KB critical <style> shell', async () => {
    const result = await renderWithMetadata(
      html`<mth-ssr-badge tone="success">Ready</mth-ssr-badge>`,
      { assetBase: '/assets/css' },
    );

    expect(result.html).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(result.links).toHaveLength(1);

    const link = result.links[0]!;
    expect(link.tagName).toBe('mth-ssr-badge');
    expect(link.href).toBe(`/assets/css/mth-ssr-badge.${computeCssHash(link.css)}.css`);
    expect(result.html).toContain(`<link rel="stylesheet" href="${link.href}">`);

    const criticalBytes = result.criticalBytesByTag['mth-ssr-badge']!;
    expect(criticalBytes).toBeGreaterThan(0);
    expect(criticalBytes).toBeLessThan(CRITICAL_SHELL_MAX_BYTES);
    expect(utf8ByteLength(link.criticalCss)).toBeLessThan(CRITICAL_SHELL_MAX_BYTES);
    expect(result.html).toContain(`<style>${link.criticalCss}</style>`);
    expect(result.html).not.toContain('letter-spacing: 0.01em');
  });

  it('renders inline mode with full component CSS inside <style> and no <link>', async () => {
    const output = await renderToString(
      html`<mth-ssr-badge tone="warn">Email</mth-ssr-badge>`,
      { styles: 'inline' },
    );

    expect(output).not.toContain('<link rel="stylesheet"');
    expect(output).toContain('<style>');
    expect(output).toContain('letter-spacing: 0.01em');
    expect(output).toContain('background: var(--_bg');
  });

  it('caps custom critical CSS strictly under 1024 UTF-8 bytes', async () => {
    const oversizedCritical = `:host{display:block;}${'.extra{color:red;}'.repeat(100)}`;
    const result = await renderWithMetadata(html`<mth-ssr-badge>Capped</mth-ssr-badge>`, {
      criticalCss: oversizedCritical,
    });

    const criticalBytes = result.criticalBytesByTag['mth-ssr-badge']!;
    expect(criticalBytes).toBeLessThan(CRITICAL_SHELL_MAX_BYTES);
  });

  it('streams DSD HTML via Web ReadableStream<Uint8Array> including async ElementRenderer thunks', async () => {
    const stream = renderToStream(
      html`<mth-ssr-async-card heading="Streaming"><span>Slotted content</span></mth-ssr-async-card>`,
    );
    const response = new Response(stream);
    const htmlText = await response.text();

    expect(htmlText).toContain('Streaming');
    expect(htmlText).toContain('Slotted content');
    expect(htmlText).toContain('<link rel="stylesheet" href="/_methane/styles/mth-ssr-async-card.');
  });

  it('collects unique stylesheet links in document order and hoists preloads into <head>', async () => {
    const bodyHtml = await renderToString(html`
      <mth-ssr-badge>One</mth-ssr-badge>
      <mth-ssr-badge>Two</mth-ssr-badge>
      <mth-ssr-async-card heading="Three"></mth-ssr-async-card>
    `);

    const links = collectStylesheetLinks(bodyHtml);
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.tagName)).toEqual(['mth-ssr-badge', 'mth-ssr-async-card']);

    const fullDoc = `<!doctype html><html><head><title>App</title></head><body>${bodyHtml}</body></html>`;
    const hoisted = hoistStylesheetLinks(fullDoc, { nonce: 'csp-123' });

    const headPart = hoisted.split('</head>')[0]!;
    expect(headPart).toContain(
      `<link rel="preload" as="style" href="${links[0]!.href}" nonce="csp-123">`,
    );
    expect(headPart).toContain(
      `<link rel="preload" as="style" href="${links[1]!.href}" nonce="csp-123">`,
    );
    // Shadow DOM <link rel="stylesheet"> remains intact inside each DSD template
    expect(hoisted.split('<link rel="stylesheet"').length - 1).toBe(3);
  });

  it('supports createSsrTransformStream for streaming head hoisting and client hydration script injection', async () => {
    const bodyHtml = await renderToString(html`<mth-ssr-badge>Stream</mth-ssr-badge>`);
    const doc = `<!doctype html><html><head></head><body>${bodyHtml}</body></html>`;
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const mid = Math.floor(doc.length / 2);
        controller.enqueue(encoder.encode(doc.slice(0, mid)));
        controller.enqueue(encoder.encode(doc.slice(mid)));
        controller.close();
      },
    });

    const transformed = source.pipeThrough(
      createSsrTransformStream({ hydrationModuleUrl: '/_methane/hydrate.js' }),
    );
    const out = await new Response(transformed).text();

    expect(out).toContain('<link rel="preload" as="style" href="/_methane/styles/mth-ssr-badge.');
    expect(out).toContain('<script type="module" src="/_methane/hydrate.js"></script></body>');
  });

  it('expands framework-serialized custom elements via transformHtmlDsd idempotently', async () => {
    const frameworkHtml =
      '<!doctype html><html><head><title>FW</title></head><body>' +
      '<mth-ssr-badge tone="info">Inside</mth-ssr-badge>' +
      '<script>const x = "<mth-ssr-badge>ignored</mth-ssr-badge>";</script>' +
      '</body></html>';

    const first = await transformHtmlDsd(frameworkHtml);
    expect(first.expandedTags).toEqual(['mth-ssr-badge']);
    expect(first.links).toHaveLength(1);
    expect(first.html).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(first.html).toContain('<link rel="preload" as="style" href="/_methane/styles/mth-ssr-badge.');
    expect(first.html).toContain('>Inside</mth-ssr-badge>');
    expect(first.html).toContain('const x = "<mth-ssr-badge>ignored</mth-ssr-badge>";');

    // Second pass must be idempotent (no duplicate templates)
    const second = await transformHtmlDsd(first.html);
    expect(second.expandedTags).toEqual([]);
    expect(second.html.split('<template shadowroot=').length - 1).toBe(1);
  });

  it('retroactively patches LitElement when lit evaluates before @methane/ssr/client and enableHydrationSupport() is called with no args', () => {
    const ssrPkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const clientUrl = pathToFileURL(resolve(ssrPkgRoot, 'dist/client.js')).href;
    const script = `
      import { LitElement } from 'lit';
      const before = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
      const { enableHydrationSupport, isHydrationSupported } = await import(${JSON.stringify(clientUrl)});
      const zeroArgResult = enableHydrationSupport();
      const after = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
      process.stdout.write(JSON.stringify({
        patchedBefore: Boolean(before && !before.configurable),
        isSupported: isHydrationSupported(),
        zeroArgResult,
        patchedAfter: Boolean(after && !after.configurable),
        createRenderRootPatched: String(LitElement.prototype.createRenderRoot).includes('_$AG'),
      }));
    `;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-'], {
      cwd: ssrPkgRoot,
      input: script,
      encoding: 'utf8',
    });
    expect(JSON.parse(stdout)).toEqual({
      patchedBefore: false,
      isSupported: true,
      zeroArgResult: true,
      patchedAfter: true,
      createRenderRootPatched: true,
    });
  });
});
