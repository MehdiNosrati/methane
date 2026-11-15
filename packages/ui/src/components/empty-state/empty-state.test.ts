import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { MthEmptyState, emptyStateSpec, registerMthEmptyState } from './index.js';

describe('<mth-empty-state>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders fallback props and slots, and supports roleMode', async () => {
    const compiled = compileSpec(emptyStateSpec);
    expect(compiled.docs).toContain('`<mth-empty-state>`');

    const report = await runBehaviorSpecAssertions(emptyStateSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const empty = document.createElement('mth-empty-state') as MthEmptyState;
    empty.heading = 'No matching records';
    empty.description = 'Adjust your filters and try again.';
    empty.variant = 'card';
    empty.tone = 'warning';
    empty.roleMode = 'status';
    document.body.appendChild(empty);
    await empty.updateComplete;

    expect(scanSameRootAria(empty).valid).toBe(true);
    const base = empty.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('role')).toBe('status');
    expect(base.getAttribute('aria-label')).toBe('No matching records');
    expect(empty.shadowRoot!.querySelector('[part="title"]')?.textContent?.trim()).toBe(
      'No matching records',
    );
    expect(empty.shadowRoot!.querySelector('[part="description"]')?.textContent?.trim()).toBe(
      'Adjust your filters and try again.',
    );

    empty.roleMode = 'none';
    await empty.updateComplete;
    expect(base.hasAttribute('role')).toBe(false);
    expect(base.hasAttribute('aria-label')).toBe(false);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-empty-state heading="Nothing here" variant="card">Add an item to begin.</mth-empty-state>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-empty-state>', 'hyd-empty-state>')
      .replaceAll('<mth-empty-state', '<hyd-empty-state');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthEmptyState('hyd');
        customElements.upgrade(host);
        await (host as MthEmptyState).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
