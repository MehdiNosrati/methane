import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import {
  MthActivityFeed,
  activityFeedSpec,
  registerMthActivityFeed,
} from './index.js';

describe('<mth-activity-feed>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes DataConsumerSuite + same-root ARIA', async () => {
    const compiled = compileSpec(activityFeedSpec);
    expect(compiled.docs).toContain('`<mth-activity-feed>`');

    const dataAdapter = {
      mount: async (source: unknown) => {
        const feed = document.createElement('mth-activity-feed') as MthActivityFeed;
        feed.dataSource = source as MthActivityFeed['dataSource'];
        document.body.appendChild(feed);
        await feed.updateComplete;
        return feed;
      },
      triggerQuery: async (el: HTMLElement, filter?: string) => {
        await (el as MthActivityFeed).query(filter ?? '');
        await (el as MthActivityFeed).updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthActivityFeed).getDataStatus(),
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('[part="item"]').length,
    };

    const specReport = await runBehaviorSpecAssertions(activityFeedSpec, {
      dataConsumer: dataAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const standaloneData = await DataConsumerSuite.run(dataAdapter);
    expect(standaloneData.failures).toEqual([]);
    expect(standaloneData.passed).toBe(true);

    const feed = document.createElement('mth-activity-feed') as MthActivityFeed;
    feed.items = [
      {
        id: '1',
        actor: 'Ada',
        title: 'merged pull request #42',
        description: 'Added table virtualizer',
        timestamp: Date.now() - 120_000,
      },
    ];
    document.body.appendChild(feed);
    await feed.updateComplete;

    expect(feed.shadowRoot!.querySelector('[part="actor"]')?.textContent).toBe('Ada');
    expect(scanSameRootAria(feed.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-activity-feed label="Recent events"><article>Deployed</article></mth-activity-feed>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-activity-feed>', 'hyd-activity-feed>')
      .replaceAll('<mth-activity-feed', '<hyd-activity-feed');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthActivityFeed('hyd');
        customElements.upgrade(host);
        await (host as MthActivityFeed).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
