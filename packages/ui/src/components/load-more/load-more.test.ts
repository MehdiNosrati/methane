import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import type { DataSource } from '@methane-ui/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMoreSpec } from './load-more.spec.js';
import { MthLoadMore, registerMthLoadMore } from './index.js';

describe('<mth-load-more>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec and passes DataConsumerSuite via DataController', async () => {
    const compiled = compileSpec(loadMoreSpec);
    expect(compiled.docs).toContain('`<mth-load-more>`');

    const report = await runBehaviorSpecAssertions(loadMoreSpec, {
      dataConsumer: {
        mount: async (source) => {
          const el = document.createElement('mth-load-more') as MthLoadMore;
          el.setDataSource(source as DataSource<Record<string, unknown>>, { load: false });
          return el;
        },
        triggerQuery: async (el, q) => {
          await (el as MthLoadMore).query(q);
          await (el as MthLoadMore).updateComplete;
        },
        getState: (el) => {
          const s = (el as MthLoadMore).status;
          return s === 'refreshing' ? 'loading' : (s as 'idle' | 'loading' | 'ready' | 'empty' | 'error');
        },
        getRenderedItemCount: (el) => el.shadowRoot!.querySelectorAll('[part="item"]').length,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('appends cursor pages on click, renders progress count, and reaches complete state', async () => {
    const pages: Record<
      string,
      { items: Array<{ id: string; label: string }>; nextCursor: string | null; total: number }
    > = {
      first: {
        items: [{ id: '1', label: 'Entry 1' }],
        nextCursor: 'page-2',
        total: 2,
      },
      'page-2': {
        items: [{ id: '2', label: 'Entry 2' }],
        nextCursor: null,
        total: 2,
      },
    };

    const el = document.createElement('mth-load-more') as unknown as MthLoadMore<{
      id: string;
      label: string;
    }>;
    el.setDataSource(
      {
        async query(req) {
          const page = pages[req.cursor ?? 'first']!;
          return { items: page.items, nextCursor: page.nextCursor, total: page.total };
        },
      },
      { load: true },
    );

    document.body.appendChild(el);
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;

    expect(el.items).toHaveLength(1);
    expect(el.shadowRoot!.querySelector('[part="progress"]')?.textContent).toMatch(
      /Showing\s+\u2068?1\u2069?\s+of\s+\u2068?2\u2069?/,
    );
    expect(scanSameRootAria(el).valid).toBe(true);

    const loadMoreEvents: Array<{ cursor: string | null }> = [];
    el.addEventListener('mth-load-more', (e) => {
      loadMoreEvents.push((e as CustomEvent<{ cursor: string | null }>).detail);
    });

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="button"]')!.click();
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
    await el.updateComplete;

    expect(loadMoreEvents).toEqual([{ cursor: 'page-2' }]);
    expect(el.items).toHaveLength(2);
    expect(el.complete).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="button"]')).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="status"]')?.textContent).toContain('All items loaded');
  });

  it('supports standalone mth-load-more dispatch, error retry, and hydration purity', async () => {
    const el = document.createElement('mth-load-more') as MthLoadMore;
    el.loadedCount = 10;
    el.totalCount = 25;
    document.body.appendChild(el);
    await el.updateComplete;

    const spy = vi.fn();
    el.addEventListener('mth-load-more', spy);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="button"]')!.click();
    expect(spy).toHaveBeenCalledTimes(1);

    let fail = true;
    el.setDataSource(
      {
        async query() {
          if (fail) {
            throw new Error('offline');
          }
          return { items: [{ id: '1', label: 'Recovered' }], nextCursor: null, total: 1 };
        },
      },
      { load: false },
    );
    await el.query('');
    await el.updateComplete;
    expect(el.status).toBe('error');

    fail = false;
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="retry"]')!.click();
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
    expect(el.items).toHaveLength(1);

    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-load-more loaded-count="5" total-count="20"></mth-load-more>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-load-more>', 'hyd-load-more>')
      .replaceAll('<mth-load-more', '<hyd-load-more');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLoadMore('hyd');
        customElements.upgrade(host);
        await (host as MthLoadMore).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
