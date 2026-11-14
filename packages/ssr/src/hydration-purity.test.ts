// @vitest-environment jsdom
import './client.js';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LitElement, css, html } from 'lit';
import { describe, expect, it } from 'vitest';
import { HydrationPuritySuite } from '@methane/test-conformance';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const ssrDistUrl = pathToFileURL(resolve(pkgRoot, 'dist/index.js')).href;

function createPanelClass() {
  return class MthPurityPanel extends LitElement {
    static override properties = {
      heading: { type: String },
      expanded: { type: Boolean, reflect: true },
    };

    static override styles = css`
      :host {
        display: block;
        inline-size: 100%;
        padding-inline: 1rem;
        padding-block: 0.75rem;
      }

      .title {
        font-weight: 700;
      }
    `;

    declare heading: string;
    declare expanded: boolean;

    constructor() {
      super();
      this.heading = 'Default Heading';
      this.expanded = false;
    }

    override render() {
      return html`<section part="base" aria-labelledby="panel-heading"><h2 id="panel-heading" class="title">${this.heading}</h2><div id="panel-state" data-expanded=${this.expanded ? 'true' : 'false'}><slot></slot></div></section>`;
    }
  };
}

function renderOnServerProcess(tagName: string, styleMode: 'linked' | 'inline'): string {
  if (!existsSync(resolve(pkgRoot, 'dist/index.js'))) {
    execFileSync('pnpm', ['build'], { cwd: pkgRoot, stdio: 'inherit' });
  }
  const serverSource = `
    import { renderToString } from ${JSON.stringify(ssrDistUrl)};
    import { LitElement, css, html } from 'lit';

    class MthPurityPanel extends LitElement {
      static properties = {
        heading: { type: String },
        expanded: { type: Boolean, reflect: true },
      };
      static styles = css\`
        :host {
          display: block;
          inline-size: 100%;
          padding-inline: 1rem;
          padding-block: 0.75rem;
        }
        .title {
          font-weight: 700;
        }
      \`;
      constructor() {
        super();
        this.heading = 'Default Heading';
        this.expanded = false;
      }
      render() {
        return html\`<section part="base" aria-labelledby="panel-heading"><h2 id="panel-heading" class="title">\${this.heading}</h2><div id="panel-state" data-expanded=\${this.expanded ? 'true' : 'false'}><slot></slot></div></section>\`;
      }
    }
    customElements.define(${JSON.stringify(tagName)}, MthPurityPanel);

    const tag = ${JSON.stringify(tagName)};
    const tpl = {
      _$litType$: 1,
      strings: Object.assign(
        ['<' + tag + ' heading="Server Title" ?expanded=', '>Body Copy</' + tag + '>'],
        { raw: ['<' + tag + ' heading="Server Title" ?expanded=', '>Body Copy</' + tag + '>'] },
      ),
      values: [true],
    };

    const out = await renderToString(tpl, { styles: ${JSON.stringify(styleMode)} });
    process.stdout.write(out);
  `;

  return execFileSync(process.execPath, ['--input-type=module', '-e', serverSource], {
    encoding: 'utf8',
    cwd: pkgRoot,
  });
}

describe('HydrationPuritySuite round-trip (@methane/ssr -> @lit-labs/ssr-client)', () => {
  it('verifies 0 shadow-DOM node mutations on client upgrade in linked mode', async () => {
    const tagName = 'mth-purity-linked';
    const ssrHtml = renderOnServerProcess(tagName, 'linked');
    expect(ssrHtml).toContain(`/_methane/styles/${tagName}.`);
    expect(ssrHtml).toContain('<style>');

    let capturedHeadingNode: Element | null = null;
    let upgradedEl: (LitElement & { heading: string }) | null = null;

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        const shadow = host.shadowRoot!;
        capturedHeadingNode = shadow.querySelector('h2');
        expect(capturedHeadingNode).not.toBeNull();
        expect(capturedHeadingNode?.textContent?.trim()).toBe('Server Title');

        if (!customElements.get(tagName)) {
          customElements.define(tagName, createPanelClass());
        }
        customElements.upgrade(host);

        const hydratedEl = host as LitElement & { heading: string };
        await hydratedEl.updateComplete;
        upgradedEl = hydratedEl;
      },
    });

    expect(report.passed).toBe(true);
    expect(report.failures).toEqual([]);

    // Post-hydration reactive update must mutate existing hydrated text node in place
    expect(upgradedEl).not.toBeNull();
    upgradedEl!.heading = 'Updated Title';
    await upgradedEl!.updateComplete;
    expect(upgradedEl!.shadowRoot?.querySelector('h2')).toBe(capturedHeadingNode);
    expect(capturedHeadingNode!.textContent?.trim()).toBe('Updated Title');
  });

  it('verifies 0 shadow-DOM node mutations on client upgrade in inline mode', async () => {
    const tagName = 'mth-purity-inline';
    const ssrHtml = renderOnServerProcess(tagName, 'inline');
    expect(ssrHtml).not.toContain('<link rel="stylesheet"');
    expect(ssrHtml).toContain('font-weight: 700');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        if (!customElements.get(tagName)) {
          customElements.define(tagName, createPanelClass());
        }
        customElements.upgrade(host);

        const hydratedEl = host as LitElement;
        await hydratedEl.updateComplete;
      },
    });

    expect(report.passed).toBe(true);
    expect(report.failures).toEqual([]);
  });
});
