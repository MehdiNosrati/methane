import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import '@methane-ui/ui/breadcrumb-item';
import type { MthBreadcrumbItem } from '@methane-ui/ui/breadcrumb-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { breadcrumbsSpec } from './breadcrumbs.spec.js';
import { MthBreadcrumbs, registerMthBreadcrumbs } from './index.js';

describe('<mth-breadcrumbs>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders localized nav landmark, and propagates separator', async () => {
    const compiled = compileSpec(breadcrumbsSpec);
    expect(compiled.docs).toContain('`<mth-breadcrumbs>`');

    const report = await runBehaviorSpecAssertions(breadcrumbsSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const navEl = document.createElement('mth-breadcrumbs') as MthBreadcrumbs;
    navEl.separator = '›';

    const home = document.createElement('mth-breadcrumb-item') as MthBreadcrumbItem;
    home.href = '/';
    home.textContent = 'Home';

    const current = document.createElement('mth-breadcrumb-item') as MthBreadcrumbItem;
    current.current = true;
    current.textContent = 'Components';

    navEl.append(home, current);
    document.body.appendChild(navEl);
    await navEl.updateComplete;
    await home.updateComplete;

    expect(navEl.shadowRoot?.querySelector('nav')?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(home.separator).toBe('›');
    expect(scanSameRootAria(navEl).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-breadcrumbs><mth-breadcrumb-item href="/">Home</mth-breadcrumb-item></mth-breadcrumbs>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-breadcrumbs>', 'hyd-breadcrumbs>')
      .replaceAll('<mth-breadcrumbs', '<hyd-breadcrumbs');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBreadcrumbs('hyd');
        customElements.upgrade(host);
        await (host as MthBreadcrumbs).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
