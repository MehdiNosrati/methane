import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { getRuntime } from '@methane-ui/core';
import type { DataSource } from '@methane-ui/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthInfiniteScroll, infiniteScrollSpec, registerMthInfiniteScroll } from './index.js';

describe('<mth-infinite-scroll>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec and passes DataConsumerSuite via DataController', async () => {
    const compiled = compileSpec(infiniteScrollSpec);
    expect(compiled.docs).toContain('`<mth-infinite-scroll>`');

    const report = await runBehaviorSpecAssertions(infiniteScrollSpec, {
      dataConsumer: {
        mount: async (source) => {
          const el = document.createElement('mth-infinite-scroll') as MthInfiniteScroll;
          el.autoLoad = false;
          el.setDataSource(source as DataSource<Record<string, unknown>>, { load: false });
          return el;
        },
        triggerQuery: async (el, q) => {
          await (el as MthInfiniteScroll).query(q);
          await (el as MthInfiniteScroll).updateComplete;
        },
        getState: (el) => {
          const s = (el as MthInfiniteScroll).status;
          return s === 'refreshing' ? 'loading' : (s as 'idle' | 'loading' | 'ready' | 'empty' | 'error');
        },
        getRenderedItemCount: (el) => el.shadowRoot!.querySelectorAll('[part="item"]').length,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('observes sentinel intersection via ObserverPoolController, supports cursor loadMore + fallback button, and cleans up on disconnect', async () => {
    const observeCallbacks: Array<(entry: IntersectionObserverEntry) => void> = [];
    const unsubSpy = vi.fn();
    const observeSpy = vi
      .spyOn(getRuntime().observers, 'observeIntersection')
      .mockImplementation((_target, cb) => {
        observeCallbacks.push(cb);
        return unsubSpy;
      });

    const pages: Record<string, { items: Array<{ id: string; label: string }>; nextCursor: string | null }> = {
      first: {
        items: [{ id: '1', label: 'Row 1' }],
        nextCursor: 'cursor-2',
      },
      'cursor-2': {
        items: [{ id: '2', label: 'Row 2' }],
        nextCursor: null,
      },
    };

    const el = document.createElement('mth-infinite-scroll') as unknown as MthInfiniteScroll<{
      id: string;
      label: string;
    }>;
    el.setDataSource(
      {
        async query(req) {
          const key = req.cursor ?? 'first';
          const page = pages[key]!;
          return { items: page.items, nextCursor: page.nextCursor };
        },
      },
      { load: false },
    );

    document.body.appendChild(el);
    await el.updateComplete;
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(scanSameRootAria(el).valid).toBe(true);

    // Initial load via fallback button
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="load-more"]')!.click();
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
    expect(el.items).toHaveLength(1);
    expect(el.nextCursor).toBe('cursor-2');

    // Simulate sentinel intersection loading cursor-2 and reaching complete state
    const lastCb = observeCallbacks[observeCallbacks.length - 1]!;
    lastCb({ isIntersecting: true } as IntersectionObserverEntry);
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;

    expect(el.items).toHaveLength(2);
    expect(el.nextCursor).toBeNull();
    expect(el.shadowRoot!.querySelector('[part="status"]')?.textContent?.trim()).toBe(
      'All items loaded',
    );

    // Disconnecting cleans up sentinel observation
    el.remove();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-infinite-scroll complete></mth-infinite-scroll>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-infinite-scroll>', 'hyd-infinite-scroll>')
      .replaceAll('<mth-infinite-scroll', '<hyd-infinite-scroll');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthInfiniteScroll('hyd');
        customElements.upgrade(host);
        await (host as MthInfiniteScroll).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
