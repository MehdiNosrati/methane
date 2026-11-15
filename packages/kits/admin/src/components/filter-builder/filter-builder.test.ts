import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthFilterBuilder,
  filterBuilderSpec,
  registerMthFilterBuilder,
} from './index.js';

describe('<mth-filter-builder>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes behavior spec assertions', async () => {
    const compiled = compileSpec(filterBuilderSpec);
    expect(compiled.docs).toContain('`<mth-filter-builder>`');
    const report = await runBehaviorSpecAssertions(filterBuilderSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('adds, updates, and removes rules while emitting mth-change', async () => {
    registerMthFilterBuilder();
    const el = document.createElement('mth-filter-builder') as MthFilterBuilder;
    el.fields = [
      { id: 'status', label: 'Status' },
      { id: 'role', label: 'Role' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    let lastRulesCount = 0;
    el.addEventListener('mth-change', (e: Event) => {
      const detail = (e as CustomEvent<{ rules: ReadonlyArray<unknown> }>).detail;
      lastRulesCount = detail.rules.length;
    });

    el.addRule({ field: 'status', operator: 'equals', value: 'active' });
    await el.updateComplete;
    expect(el.rules).toHaveLength(1);
    expect(lastRulesCount).toBe(1);

    el.clearRules();
    await el.updateComplete;
    expect(el.rules).toHaveLength(0);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-filter-builder combinator="and"></mth-filter-builder>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-filter-builder>', 'hyd-filter-builder>')
      .replaceAll('<mth-filter-builder', '<hyd-filter-builder');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFilterBuilder('hyd');
        customElements.upgrade(host);
        await (host as MthFilterBuilder).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
