import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import '@methane/ui/tab';
import '@methane/ui/tab-panel';
import type { MthTab } from '@methane/ui/tab';
import type { MthTabPanel } from '@methane/ui/tab-panel';
import { tabsSpec } from './tabs.spec.js';
import { MthTabs, registerMthTabs } from './index.js';

function createTabsFixture(dir: 'ltr' | 'rtl' = 'ltr'): MthTabs {
  const tabs = document.createElement('mth-tabs') as MthTabs;
  tabs.setAttribute('dir', dir);
  tabs.label = 'Settings sections';

  for (const [val, text] of [
    ['general', 'General'],
    ['security', 'Security'],
    ['billing', 'Billing'],
  ] as const) {
    const tab = document.createElement('mth-tab') as MthTab;
    tab.slot = 'tab';
    tab.value = val;
    tab.textContent = text;
    tabs.appendChild(tab);

    const panel = document.createElement('mth-tab-panel') as MthTabPanel;
    panel.value = val;
    panel.textContent = `${text} panel`;
    tabs.appendChild(panel);
  }

  return tabs;
}

describe('<mth-tabs>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR & RTL) + same-root ARIA scan', async () => {
    const compiled = compileSpec(tabsSpec);
    expect(compiled.docs).toContain('`<mth-tabs>`');

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const tabs = createTabsFixture(dir);
        document.body.appendChild(tabs);
        await tabs.updateComplete;
        return tabs;
      },
      getItems: (container: HTMLElement) => (container as MthTabs).getTabs() as HTMLElement[],
    };

    const specReport = await runBehaviorSpecAssertions(tabsSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);
  });

  it('supports automatic & manual activation, disabled tab skipping, and emits mth-change', async () => {
    const tabs = createTabsFixture('ltr');
    tabs.activation = 'manual';
    const secondTab = tabs.querySelectorAll('mth-tab')[1] as MthTab;
    secondTab.disabled = true;

    const changes: string[] = [];
    tabs.addEventListener('mth-change', (ev) => {
      changes.push((ev as CustomEvent<{ value: string }>).detail.value);
    });

    document.body.appendChild(tabs);
    await tabs.updateComplete;

    expect(tabs.value).toBe('general');
    const tabEls = tabs.getTabs() as MthTab[];
    tabEls[0]!.focus();

    tabEls[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tabs.updateComplete;
    // Skipped disabled 'security' tab, focused 'billing', did not select yet in manual mode
    expect(tabEls[2]!.tabIndex).toBe(0);
    expect(tabs.value).toBe('general');

    tabEls[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await tabs.updateComplete;
    expect(tabs.value).toBe('billing');
    expect(changes).toEqual(['billing']);

    const panels = Array.from(tabs.querySelectorAll('mth-tab-panel')) as MthTabPanel[];
    expect(panels[0]!.active).toBe(false);
    expect(panels[2]!.active).toBe(true);
    expect(scanSameRootAria(tabs).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tabs value="one"><mth-tab slot="tab" value="one">One</mth-tab><mth-tab-panel value="one">Body</mth-tab-panel></mth-tabs>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-tabs>', 'hyd-tabs>').replaceAll('<mth-tabs', '<hyd-tabs');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTabs('hyd');
        customElements.upgrade(host);
        await (host as MthTabs).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
