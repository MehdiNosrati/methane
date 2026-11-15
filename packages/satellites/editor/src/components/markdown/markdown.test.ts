import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { markdownSpec } from './markdown.spec.js';
import { MthMarkdown, registerMthMarkdown } from './index.js';

describe('<mth-markdown>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec and SatelliteEngineSuite (50x lifecycle + token sync)', async () => {
    const compiled = compileSpec(markdownSpec);
    expect(compiled.docs).toContain('`<mth-markdown>`');

    const report = await runBehaviorSpecAssertions(markdownSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-markdown') as MthMarkdown;
          el.content = '# Heading';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthMarkdown).engine?.getThemeToken(tokenName) ?? '',
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-markdown') as MthMarkdown,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthMarkdown).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);
  });

  it('escapes raw HTML by default and blocks unsafe URL schemes while supporting slotted Markdown', async () => {
    const el = document.createElement('mth-markdown') as MthMarkdown;
    el.content = [
      '# Welcome',
      '',
      '**Bold** and `code` with [Safe](https://example.com) and [Bad](javascript:alert(1)).',
      '',
      '<script>alert("xss")</script>',
    ].join('\n');
    document.body.appendChild(el);
    await el.updateComplete;

    const out = el.shadowRoot!.querySelector<HTMLElement>('[part="content"]')!;
    expect(out.querySelector('h1')?.textContent).toBe('Welcome');
    expect(out.querySelector('strong')?.textContent).toBe('Bold');
    expect(out.querySelector('code')?.textContent).toBe('code');
    expect(out.querySelector('script')).toBeNull();

    const links = Array.from(out.querySelectorAll('a'));
    expect(links.some((a) => a.getAttribute('href') === 'https://example.com')).toBe(true);
    expect(links.every((a) => !(a.getAttribute('href') ?? '').includes('javascript:'))).toBe(true);

    // Light-DOM slot fallback when content prop is cleared
    el.content = '';
    el.textContent = '- Item One\n- Item Two';
    await el.updateComplete;
    await Promise.resolve();
    expect(out.textContent).toContain('Item One');
    // Inline parser edge cases: query strings, raw HTML inside code, nested markdown in code/href
    el.textContent = '';
    el.content = [
      '[Query](https://example.com/search?a=1&b=2)',
      '[Archive](https://web.archive.org/web/*/example.com)',
      '`a *b* [x](https://y)`',
    ].join('\n\n');
    await el.updateComplete;

    const queryHref = out.querySelector('a[href*="search"]')?.getAttribute('href');
    expect(queryHref).toBe('https://example.com/search?a=1&b=2');
    const archiveHref = out.querySelector('a[href*="web.archive.org"]')?.getAttribute('href');
    expect(archiveHref).toBe('https://web.archive.org/web/*/example.com');
    const codeSpan = out.querySelector('code');
    expect(codeSpan?.textContent).toBe('a *b* [x](https://y)');
    expect(codeSpan?.querySelector('em, a')).toBeNull();

    // allowRawHtml: true must still escape HTML inside inline code spans
    el.allowRawHtml = true;
    el.content = '`<b>unsafe</b>`';
    await el.updateComplete;
    expect(out.querySelector('code')?.textContent).toBe('<b>unsafe</b>');
    expect(out.querySelector('code b')).toBeNull();

    // Same-instance remove() -> appendChild() reconnect re-renders cleanly
    el.allowRawHtml = false;
    el.content = '# Reconnected';
    await el.updateComplete;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(out.querySelector('h1')?.textContent).toBe('Reconnected');

    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-markdown content="## SSR Markdown"></mth-markdown>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-markdown>', 'hyd-markdown>')
      .replaceAll('<mth-markdown', '<hyd-markdown');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMarkdown('hyd');
        customElements.upgrade(host);
        await (host as MthMarkdown).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);

    // Disconnect before 0ms DSD timer fires and reconnect
    const parsedDoc = new DOMParser().parseFromString(ssrHtml, 'text/html');
    const host2 = document.adoptNode(parsedDoc.body.querySelector('hyd-markdown')!) as MthMarkdown;
    const dsdTpl = host2.querySelector(':scope > template[shadowrootmode]') as HTMLTemplateElement | null;
    if (dsdTpl && !host2.shadowRoot) {
      const sr = host2.attachShadow({ mode: 'open' });
      sr.appendChild(dsdTpl.content.cloneNode(true));
      dsdTpl.remove();
    }
    document.body.appendChild(host2);
    customElements.upgrade(host2);
    await host2.updateComplete;
    host2.remove();
    document.body.appendChild(host2);
    await host2.updateComplete;
    expect(host2.shadowRoot?.querySelector('h2')?.textContent).toBe('SSR Markdown');
  });
});
