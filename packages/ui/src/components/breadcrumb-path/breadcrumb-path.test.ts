import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { breadcrumbPathSpec } from './breadcrumb-path.spec.js';
import { MthBreadcrumbPath, registerMthBreadcrumbPath } from './index.js';

describe('<mth-breadcrumb-path>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('collapses long trails with middle ellipsis, filters unsafe hrefs, and expands on click', async () => {
    const compiled = compileSpec(breadcrumbPathSpec);
    expect(compiled.docs).toContain('`<mth-breadcrumb-path>`');
    const specReport = await runBehaviorSpecAssertions(breadcrumbPathSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-breadcrumb-path') as MthBreadcrumbPath;
    el.maxItems = 3;
    el.items = [
      { label: 'Root', href: '/' },
      { label: 'Workspace', href: '/ws' },
      { label: 'Unsafe', href: 'javascript:alert(1)' },
      { label: 'Repo', href: '/ws/repo' },
      { label: 'Settings', current: true },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const ellipsis = el.shadowRoot!.querySelector('[part="ellipsis"]') as HTMLButtonElement;
    expect(ellipsis).not.toBeNull();
    const visibleBefore = el.shadowRoot!.querySelectorAll('[part="link"]');
    expect(visibleBefore.length).toBe(3);

    ellipsis.click();
    await el.updateComplete;
    expect(el.expanded).toBe(true);
    const linksAfter = el.shadowRoot!.querySelectorAll('[part="link"]');
    expect(linksAfter.length).toBe(5);
    expect(linksAfter[2]?.tagName).toBe('SPAN');
    expect(linksAfter[4]?.getAttribute('aria-current')).toBe('page');
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-breadcrumb-path separator=">"></mth-breadcrumb-path>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-breadcrumb-path>', 'hyd-breadcrumb-path>')
      .replaceAll('<mth-breadcrumb-path', '<hyd-breadcrumb-path');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBreadcrumbPath('hyd');
        customElements.upgrade(host);
        await (host as MthBreadcrumbPath).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
