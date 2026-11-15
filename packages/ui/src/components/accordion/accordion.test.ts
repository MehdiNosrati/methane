import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/accordion-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthAccordion, accordionSpec, registerMthAccordion } from './index.js';

type ItemWithUpdate = HTMLElement & {
  value: string;
  heading: string;
  expanded: boolean;
  disabled: boolean;
  updateComplete: Promise<boolean>;
};

describe('<mth-accordion>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and RovingFocusSuite across item triggers', async () => {
    const compiled = compileSpec(accordionSpec);
    expect(compiled.docs).toContain('`<mth-accordion>`');

    const report = await runBehaviorSpecAssertions(accordionSpec, {
      rovingFocus: {
        orientation: 'vertical',
        loop: true,
        mount: async () => {
          const accordion = document.createElement('mth-accordion') as MthAccordion;
          const item1 = document.createElement('mth-accordion-item') as ItemWithUpdate;
          item1.value = 'one';
          item1.heading = 'First';
          const item2 = document.createElement('mth-accordion-item') as ItemWithUpdate;
          item2.value = 'two';
          item2.heading = 'Second';
          const item3 = document.createElement('mth-accordion-item') as ItemWithUpdate;
          item3.value = 'three';
          item3.heading = 'Third';
          accordion.append(item1, item2, item3);
          document.body.appendChild(accordion);
          await Promise.all([
            accordion.updateComplete,
            item1.updateComplete,
            item2.updateComplete,
            item3.updateComplete,
          ]);
          await accordion.updateComplete;
          return accordion;
        },
        getItems: (container) => {
          return Array.from(container.children)
            .map((child) => child.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]'))
            .filter((el): el is HTMLElement => Boolean(el));
        },
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const standaloneReport = await RovingFocusSuite.run({
      orientation: 'vertical',
      loop: true,
      mount: async () => {
        const accordion = document.createElement('mth-accordion') as MthAccordion;
        const a = document.createElement('mth-accordion-item') as ItemWithUpdate;
        a.value = 'a';
        a.heading = 'A';
        const b = document.createElement('mth-accordion-item') as ItemWithUpdate;
        b.value = 'b';
        b.heading = 'B';
        accordion.append(a, b);
        document.body.appendChild(accordion);
        await Promise.all([accordion.updateComplete, a.updateComplete, b.updateComplete]);
        await accordion.updateComplete;
        return accordion;
      },
      getItems: (container) =>
        Array.from(container.children)
          .map((child) => child.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]'))
          .filter((el): el is HTMLElement => Boolean(el)),
    });
    expect(standaloneReport.passed).toBe(true);
  });

  it('supports single/multiple/collapsible selection, mth-change, and same-root ARIA', async () => {
    const accordion = document.createElement('mth-accordion') as MthAccordion;
    accordion.collapsible = false;

    const item1 = document.createElement('mth-accordion-item') as ItemWithUpdate;
    item1.value = 's1';
    item1.heading = 'Section 1';
    const item2 = document.createElement('mth-accordion-item') as ItemWithUpdate;
    item2.value = 's2';
    item2.heading = 'Section 2';

    accordion.append(item1, item2);
    document.body.appendChild(accordion);
    await Promise.all([accordion.updateComplete, item1.updateComplete, item2.updateComplete]);
    await accordion.updateComplete;

    // Non-collapsible selects first item automatically
    expect(item1.expanded).toBe(true);
    expect(item2.expanded).toBe(false);

    const changes: string[] = [];
    accordion.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<{ value: string }>).detail.value);
    });

    // Clicking expanded item when collapsible=false keeps it open
    item1.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click();
    await accordion.updateComplete;
    expect(item1.expanded).toBe(true);

    // Clicking second item switches in single mode
    item2.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click();
    await accordion.updateComplete;
    await item1.updateComplete;
    await item2.updateComplete;
    expect(item1.expanded).toBe(false);
    expect(item2.expanded).toBe(true);
    expect(accordion.value).toBe('s2');
    expect(changes).toEqual(['s2']);

    // Multiple + collapsible allows both open and collapsing all
    accordion.multiple = true;
    accordion.collapsible = true;
    await accordion.updateComplete;
    item1.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click();
    await accordion.updateComplete;
    await item1.updateComplete;
    expect(item1.expanded).toBe(true);
    expect(item2.expanded).toBe(true);
    expect(scanSameRootAria(accordion).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-accordion multiple></mth-accordion>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-accordion>', 'hyd-accordion>')
      .replaceAll('<mth-accordion', '<hyd-accordion');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthAccordion('hyd');
        customElements.upgrade(host);
        await (host as MthAccordion).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
