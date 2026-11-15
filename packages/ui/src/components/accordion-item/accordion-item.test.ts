import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { accordionItemSpec } from './accordion-item.spec.js';
import { MthAccordionItem, registerMthAccordionItem } from './index.js';

describe('<mth-accordion-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, uses same-root trigger/region ARIA, and animates via MotionController', async () => {
    const compiled = compileSpec(accordionItemSpec);
    expect(compiled.docs).toContain('`<mth-accordion-item>`');

    const report = await runBehaviorSpecAssertions(accordionItemSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const item = document.createElement('mth-accordion-item') as MthAccordionItem;
    item.value = 'sec-1';
    item.heading = 'Section 1';
    item.textContent = 'Panel content.';
    document.body.appendChild(item);
    await item.updateComplete;

    const trigger = item.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
    const panel = item.shadowRoot!.querySelector<HTMLElement>('[part="panel"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('mth-acc-panel');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe('mth-acc-trigger');
    expect(panel.hidden).toBe(true);
    expect(scanSameRootAria(item).valid).toBe(true);

    trigger.click();
    await item.updateComplete;
    await Promise.resolve();
    expect(item.expanded).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(scanSameRootAria(item).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-accordion-item value="one" heading="Details">Body</mth-accordion-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).toContain('shadowrootdelegatesfocus');

    const ssrHtml = rawSsr
      .replaceAll('mth-accordion-item>', 'hyd-accordion-item>')
      .replaceAll('<mth-accordion-item', '<hyd-accordion-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAccordionItem('hyd');
        customElements.upgrade(host);
        await (host as MthAccordionItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
