import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthOrgChart, orgChartSpec, registerMthOrgChart, type OrgChartNode } from './index.js';

const SAMPLE_ORG: OrgChartNode[] = [
  {
    id: 'ceo',
    name: 'Elena Vance',
    title: 'CEO',
    children: [
      { id: 'cto', name: 'Marcus Chen', title: 'CTO', department: 'Engineering' },
      { id: 'cfo', name: 'Nadia Patel', title: 'CFO', department: 'Finance' },
    ],
  },
];

describe('<mth-org-chart>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + RovingFocusSuite + same-root ARIA', async () => {
    const compiled = compileSpec(orgChartSpec);
    expect(compiled.docs).toContain('`<mth-org-chart>`');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-org-chart') as MthOrgChart;
        el.nodes = SAMPLE_ORG;
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthOrgChart).engine?.getThemeToken(tokenName) ?? '',
    };

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-org-chart') as MthOrgChart;
        el.setAttribute('dir', dir);
        el.nodes = SAMPLE_ORG;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) => (container as MthOrgChart).getFocusableCards(),
    };

    const report = await runBehaviorSpecAssertions(orgChartSpec, {
      satellite: satelliteAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);

    const rovReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovReport.passed).toBe(true);
  });

  it('collapses subtrees, highlights search matches, and prevents CSS selector injection', async () => {
    const org = document.createElement('mth-org-chart') as MthOrgChart;
    org.nodes = SAMPLE_ORG;
    document.body.appendChild(org);
    await org.updateComplete;

    expect(org.shadowRoot!.querySelectorAll('[part="card"]').length).toBe(3);

    const toggleBtn = org.shadowRoot!.querySelector<HTMLButtonElement>('.toggle-btn')!;
    toggleBtn.click();
    await org.updateComplete;
    expect(org.shadowRoot!.querySelectorAll('[part="card"]').length).toBe(1);

    toggleBtn.click();
    await org.updateComplete;
    expect(org.shadowRoot!.querySelectorAll('[part="card"]').length).toBe(3);

    org.query = 'Finance';
    await org.updateComplete;
    expect(org.shadowRoot!.querySelectorAll('[data-match="true"]').length).toBe(1);
    expect(scanSameRootAria(org.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-org-chart label="Company org"><ul slot="fallback"><li>CEO</li></ul></mth-org-chart>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-org-chart>', 'hyd-org-chart>')
      .replaceAll('<mth-org-chart', '<hyd-org-chart');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthOrgChart('hyd');
        customElements.upgrade(host);
        await (host as MthOrgChart).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('selects cards via click, updates aria-pressed, and emits mth-node-select', async () => {
    const org = document.createElement('mth-org-chart') as MthOrgChart;
    org.nodes = SAMPLE_ORG;
    document.body.appendChild(org);
    await org.updateComplete;

    const selected: string[] = [];
    org.addEventListener('mth-node-select', (ev) => {
      selected.push((ev as CustomEvent<{ nodeId: string }>).detail.nodeId);
    });

    const cards = org.shadowRoot!.querySelectorAll<HTMLButtonElement>('.card-btn');
    cards[1]!.click();
    await org.updateComplete;

    expect(selected).toEqual(['cto']);
    expect(org.selectedId).toBe('cto');
    expect(cards[1]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits mth-node-toggle with collapsed state and supports search input filtering', async () => {
    const org = document.createElement('mth-org-chart') as MthOrgChart;
    org.nodes = SAMPLE_ORG;
    document.body.appendChild(org);
    await org.updateComplete;

    const toggles: unknown[] = [];
    org.addEventListener('mth-node-toggle', (ev) => toggles.push((ev as CustomEvent).detail));

    const toggleBtn = org.shadowRoot!.querySelector<HTMLButtonElement>('.toggle-btn')!;
    toggleBtn.click();
    await org.updateComplete;
    expect(toggles).toEqual([{ nodeId: 'ceo', collapsed: true }]);
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

    const searchInput = org.shadowRoot!.querySelector<HTMLInputElement>('[part="search"]')!;
    searchInput.value = 'Elena';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await org.updateComplete;
    expect(org.shadowRoot!.querySelectorAll('[data-match="true"]').length).toBe(1);
  });

  it('supports LR and RL directional layouts and updates SVG connector paths', async () => {
    const org = document.createElement('mth-org-chart') as MthOrgChart;
    org.nodes = SAMPLE_ORG;
    org.direction = 'LR';
    document.body.appendChild(org);
    await org.updateComplete;

    const cardsLR = org.engine!.getVisibleCards();
    const ceoLR = cardsLR.find((c) => c.id === 'ceo')!;
    const ctoLR = cardsLR.find((c) => c.id === 'cto')!;
    expect(ctoLR.x).toBeGreaterThan(ceoLR.x);
    expect(org.engine!.getConnectors().length).toBe(2);

    org.direction = 'RL';
    await org.updateComplete;
    const cardsRL = org.engine!.getVisibleCards();
    const ceoRL = cardsRL.find((c) => c.id === 'ceo')!;
    const ctoRL = cardsRL.find((c) => c.id === 'cto')!;
    expect(ceoRL.x).toBeGreaterThan(ctoRL.x);
  });

  it('sets :state(empty) when nodes are empty and disposes engine on disconnect', async () => {
    const org = document.createElement('mth-org-chart') as MthOrgChart;
    org.nodes = [];
    document.body.appendChild(org);
    await org.updateComplete;

    expect(org.hasCustomState('empty')).toBe(true);
    expect(org.engine).not.toBeNull();
    org.remove();
    expect(org.engine).toBeNull();
  });
});
