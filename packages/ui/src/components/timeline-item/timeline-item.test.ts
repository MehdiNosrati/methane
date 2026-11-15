import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { timelineItemSpec } from './timeline-item.spec.js';
import { MthTimelineItem, registerMthTimelineItem } from './index.js';

describe('<mth-timeline-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders heading/timestamp/body, and passes same-root ARIA', async () => {
    const compiled = compileSpec(timelineItemSpec);
    expect(compiled.docs).toContain('`<mth-timeline-item>`');

    const report = await runBehaviorSpecAssertions(timelineItemSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const item = document.createElement('mth-timeline-item') as MthTimelineItem;
    item.heading = 'Build succeeded';
    item.timestamp = '10:42 AM';
    item.variant = 'success';
    item.active = true;
    item.textContent = 'All 42 checks passed.';
    document.body.appendChild(item);
    await item.updateComplete;

    expect(item.shadowRoot!.querySelector('[part="heading"]')?.textContent?.trim()).toBe('Build succeeded');
    expect(item.shadowRoot!.querySelector('[part="timestamp"]')?.textContent?.trim()).toBe('10:42 AM');
    expect(scanSameRootAria(item).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-timeline-item heading="Deployed" timestamp="2m ago" variant="accent">Release v1.0</mth-timeline-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-timeline-item>', 'hyd-timeline-item>')
      .replaceAll('<mth-timeline-item', '<hyd-timeline-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTimelineItem('hyd');
        customElements.upgrade(host);
        await (host as MthTimelineItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
