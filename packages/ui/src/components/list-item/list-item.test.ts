import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthListItem, listItemSpec, registerMthListItem } from './index.js';

describe('<mth-list-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders slots/description, and blocks unsafe href', async () => {
    const compiled = compileSpec(listItemSpec);
    expect(compiled.docs).toContain('`<mth-list-item>`');

    const report = await runBehaviorSpecAssertions(listItemSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const item = document.createElement('mth-list-item') as MthListItem;
    item.value = 'profile';
    item.description = 'Manage profile settings';
    item.href = 'javascript:alert(1)';
    item.textContent = 'Profile';
    document.body.appendChild(item);
    await item.updateComplete;

    expect(item.shadowRoot!.querySelector('a')).toBeNull();
    item.href = '/settings/profile';
    await item.updateComplete;
    expect(item.shadowRoot!.querySelector('a')?.getAttribute('href')).toBe('/settings/profile');
    expect(scanSameRootAria(item).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-list-item value="one" description="Details">First</mth-list-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-list-item>', 'hyd-list-item>')
      .replaceAll('<mth-list-item', '<hyd-list-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthListItem('hyd');
        customElements.upgrade(host);
        await (host as MthListItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
