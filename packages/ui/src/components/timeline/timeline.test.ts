import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/timeline-item';
import type { MthTimelineItem } from '@methane/ui/timeline-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTimeline, registerMthTimeline, timelineSpec } from './index.js';

describe('<mth-timeline>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, collects <mth-timeline-item> children, and passes same-root ARIA', async () => {
    const compiled = compileSpec(timelineSpec);
    expect(compiled.docs).toContain('`<mth-timeline>`');

    const report = await runBehaviorSpecAssertions(timelineSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const tl = document.createElement('mth-timeline') as MthTimeline;
    tl.label = 'Release History';
    const first = document.createElement('mth-timeline-item') as MthTimelineItem;
    first.heading = 'Created';
    first.timestamp = '09:00';
    const second = document.createElement('mth-timeline-item') as MthTimelineItem;
    second.heading = 'Published';
    second.timestamp = '10:00';
    tl.append(first, second);
    document.body.appendChild(tl);
    await tl.updateComplete;

    expect(tl.getSlottedItems().length).toBe(2);
    expect(scanSameRootAria(tl).valid).toBe(true);

    const dataTl = document.createElement('mth-timeline') as MthTimeline;
    dataTl.items = [{ heading: 'Step 1', timestamp: 'Now', description: 'Done' }];
    document.body.appendChild(dataTl);
    await dataTl.updateComplete;
    expect(dataTl.shadowRoot!.querySelectorAll('[part="item"]').length).toBe(1);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-timeline><mth-timeline-item heading="Init" timestamp="1m">Boot</mth-timeline-item></mth-timeline>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-timeline>', 'hyd-timeline>')
      .replaceAll('<mth-timeline', '<hyd-timeline');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTimeline('hyd');
        customElements.upgrade(host);
        await (host as MthTimeline).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
