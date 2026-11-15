import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { breadcrumbItemSpec } from './breadcrumb-item.spec.js';
import { MthBreadcrumbItem, registerMthBreadcrumbItem } from './index.js';

describe('<mth-breadcrumb-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and sets aria-current="page" when current is true', async () => {
    const compiled = compileSpec(breadcrumbItemSpec);
    expect(compiled.docs).toContain('`<mth-breadcrumb-item>`');

    const report = await runBehaviorSpecAssertions(breadcrumbItemSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-breadcrumb-item') as MthBreadcrumbItem;
    el.href = '/docs';
    el.textContent = 'Docs';
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('a[part="link"]')?.getAttribute('href')).toBe('/docs');

    el.current = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="label"]')?.getAttribute('aria-current')).toBe('page');
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-breadcrumb-item href="/home">Home</mth-breadcrumb-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-breadcrumb-item>', 'hyd-breadcrumb-item>')
      .replaceAll('<mth-breadcrumb-item', '<hyd-breadcrumb-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBreadcrumbItem('hyd');
        customElements.upgrade(host);
        await (host as MthBreadcrumbItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
