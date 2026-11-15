import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { paginationSpec } from './pagination.spec.js';
import { MthPagination, registerMthPagination } from './index.js';

describe('<mth-pagination>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders localized labels and aria-current="page", and emits mth-change', async () => {
    const compiled = compileSpec(paginationSpec);
    expect(compiled.docs).toContain('`<mth-pagination>`');

    const report = await runBehaviorSpecAssertions(paginationSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-pagination') as MthPagination;
    el.page = 5;
    el.totalPages = 10;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    const currentBtn = el.shadowRoot?.querySelector('[part="page"][aria-current="page"]');
    expect(currentBtn?.textContent?.trim()).toBe('5');
    expect(el.shadowRoot?.querySelectorAll('[part="ellipsis"]').length).toBe(2);

    const pages: number[] = [];
    el.addEventListener('mth-change', (ev) => {
      pages.push((ev as CustomEvent<{ page: number }>).detail.page);
    });

    (el.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.page).toBe(6);
    expect(pages).toEqual([6]);

    (el.shadowRoot?.querySelector('[part="prev"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.page).toBe(5);
    expect(pages).toEqual([6, 5]);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-pagination page="2" total-pages="5"></mth-pagination>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-pagination>', 'hyd-pagination>')
      .replaceAll('<mth-pagination', '<hyd-pagination');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPagination('hyd');
        customElements.upgrade(host);
        await (host as MthPagination).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
