import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import type { DataSource } from '@methane-ui/primitives';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthKanban,
  kanbanSpec,
  registerMthKanban,
  type KanbanCard,
} from './index.js';

describe('<mth-kanban>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite + DataConsumerSuite', async () => {
    registerMthKanban();
    const compiled = compileSpec(kanbanSpec);
    expect(compiled.docs).toContain('`<mth-kanban>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-kanban') as MthKanban;
        el.dir = dir;
        el.lanes = [
          { id: 'todo', label: 'To Do', wipLimit: 2 },
          { id: 'doing', label: 'In Progress', wipLimit: 1 },
        ];
        el.cards = [
          { id: 'c1', laneId: 'todo', title: 'Write specs' },
          { id: 'c2', laneId: 'todo', title: 'Review PR' },
          { id: 'c3', laneId: 'doing', title: 'Ship build' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.card')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const dataAdapter = {
      mount: async (ds: unknown) => {
        const el = document.createElement('mth-kanban') as MthKanban;
        el.lanes = [{ id: 'todo', label: 'To Do' }];
        const rawSource = ds as DataSource<{ id: string; label: string }, string>;
        el.dataSource = {
          query: async (q) => {
            const res = await rawSource.query(q);
            return {
              items: res.items.map((item) => ({
                id: item.id,
                laneId: 'todo',
                title: item.label,
              })),
              total: res.total ?? res.items.length,
            };
          },
        };
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      triggerQuery: async (el: HTMLElement, q?: string) => {
        await (el as MthKanban).query(q ?? '');
        await (el as MthKanban).updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthKanban).dataStatus,
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('.card').length,
    };

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);

    const dataReport = await DataConsumerSuite.run(dataAdapter);
    expect(dataReport.failures).toEqual([]);
    expect(dataReport.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(kanbanSpec, {
      rovingFocus: rovingAdapter,
      dataConsumer: dataAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('moves cards across lanes and tracks WIP limit badges', async () => {
    registerMthKanban();
    const el = document.createElement('mth-kanban') as MthKanban;
    el.lanes = [
      { id: 'todo', label: 'To Do', wipLimit: 1 },
      { id: 'done', label: 'Done', wipLimit: 1 },
    ];
    el.cards = [
      { id: 'c1', laneId: 'todo', title: 'Task 1' },
      { id: 'c2', laneId: 'todo', title: 'Task 2' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const lanes = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="lane"]');
    expect(lanes[0]?.dataset.overWip).toBe('true');
    expect(lanes[1]?.dataset.overWip).toBe('false');

    let movedDetail: { cardId: string; toLaneId: string; cards: ReadonlyArray<KanbanCard> } | undefined;
    el.addEventListener('mth-card-move', ((e: CustomEvent) => {
      movedDetail = e.detail;
    }) as EventListener);

    el.moveCard('c1', 'done');
    await el.updateComplete;

    expect(movedDetail?.cardId).toBe('c1');
    expect(movedDetail?.toLaneId).toBe('done');
    expect(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="lane"]')[0]?.dataset.overWip).toBe(
      'false',
    );

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-kanban></mth-kanban>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-kanban>', 'hyd-kanban>')
      .replaceAll('<mth-kanban', '<hyd-kanban');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthKanban('hyd');
        customElements.upgrade(host);
        await (host as MthKanban).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
