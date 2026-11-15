import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { citationListSpec } from './citation-list.spec.js';
import { MthCitationList, isSafeHttpUrl, registerMthCitationList } from './index.js';

describe('<mth-citation-list>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite (LTR + RTL), and blocks non-HTTP(S) URLs', async () => {
    const compiled = compileSpec(citationListSpec);
    expect(compiled.docs).toContain('`<mth-citation-list>`');

    const report = await runBehaviorSpecAssertions(citationListSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    expect(isSafeHttpUrl('https://methane.dev/docs')).toBe(true);
    expect(isSafeHttpUrl('http://localhost:3000')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);

    const rf = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-citation-list') as MthCitationList;
        if (dir) el.setAttribute('dir', dir);
        el.citations = [
          { id: 'c1', title: 'Methane Docs', url: 'https://methane.dev/docs' },
          { id: 'c2', title: 'Blocked XSS', url: 'javascript:alert(1)' },
          { id: 'c3', title: 'ADR Spec', url: 'https://methane.dev/adr' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) => (el as MthCitationList).getItemElements(),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rf.failures).toEqual([]);
    expect(rf.passed).toBe(true);

    const el = document.createElement('mth-citation-list') as MthCitationList;
    el.citations = [
      { id: 'c1', title: 'Safe', url: 'https://methane.dev' },
      { id: 'c2', title: 'Unsafe', url: 'javascript:alert(1)' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const items = el.getItemElements();
    expect(items[0]?.tagName).toBe('A');
    expect(items[0]?.getAttribute('href')).toBe('https://methane.dev');
    expect(items[1]?.tagName).toBe('BUTTON');
    expect(items[1]?.hasAttribute('href')).toBe(false);

    let selectedDetail: unknown = null;
    el.addEventListener('mth-select', (e: Event) => {
      selectedDetail = (e as CustomEvent).detail;
    });
    items[0]?.click();
    expect(selectedDetail).toEqual({
      id: 'c1',
      index: 1,
      title: 'Safe',
      url: 'https://methane.dev',
    });
    expect(scanSameRootAria(el).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-citation-list label="References"></mth-citation-list>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-citation-list', '<hyd-citation-list')
      .replaceAll('</mth-citation-list>', '</hyd-citation-list>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCitationList('hyd');
        customElements.upgrade(host);
        await (host as MthCitationList).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
