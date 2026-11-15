import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { tocSpec } from './toc.spec.js';
import { MthToc, registerMthToc } from './index.js';

describe('<mth-toc>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec, discovers headings, tracks active section, and sanitizes links', async () => {
    const compiled = compileSpec(tocSpec);
    expect(compiled.docs).toContain('`<mth-toc>`');

    const report = await runBehaviorSpecAssertions(tocSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const h2 = document.createElement('h2');
    h2.id = 'overview';
    h2.textContent = 'Overview';
    const h3 = document.createElement('h3');
    h3.id = 'usage';
    h3.textContent = 'Usage';
    document.body.append(h2, h3);

    const toc = document.createElement('mth-toc') as MthToc;
    toc.targetSelector = 'h2[id], h3[id]';
    document.body.appendChild(toc);
    await toc.updateComplete;

    const links = toc.shadowRoot!.querySelectorAll<HTMLAnchorElement>('[part="link"]');
    expect(links).toHaveLength(2);
    expect(links[1]?.dataset['level']).toBe('3');

    const onSelect = vi.fn();
    toc.addEventListener('mth-select', onSelect);
    links[1]?.click();
    await toc.updateComplete;

    expect(toc.activeId).toBe('usage');
    expect(links[1]?.getAttribute('aria-current')).toBe('location');
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'usage', label: 'Usage', href: '#usage' } }),
    );
    expect(scanSameRootAria(toc.shadowRoot!).issues).toEqual([]);
  });

  it('rejects unsafe javascript: hrefs in items array', async () => {
    const toc = document.createElement('mth-toc') as MthToc;
    toc.items = [{ id: 'xss', label: 'Evil', href: 'javascript:alert(1)' }];
    document.body.appendChild(toc);
    await toc.updateComplete;

    const link = toc.shadowRoot!.querySelector<HTMLAnchorElement>('[part="link"]');
    expect(link?.getAttribute('href')).toBe('#xss');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-toc heading="Contents"></mth-toc>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-toc>', 'hyd-toc>').replaceAll('<mth-toc', '<hyd-toc');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthToc('hyd');
        customElements.upgrade(host);
        await (host as MthToc).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
