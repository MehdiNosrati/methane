import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { badgeSpec } from './badge.spec.js';
import { MthBadge, registerMthBadge } from './index.js';

describe('<mth-badge>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, supports variants/sizes/pill/dot, and same-root ARIA', async () => {
    const compiled = compileSpec(badgeSpec);
    expect(compiled.docs).toContain('`<mth-badge>`');

    const report = await runBehaviorSpecAssertions(badgeSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const badge = document.createElement('mth-badge') as MthBadge;
    badge.variant = 'accent';
    badge.size = 'lg';
    badge.pill = true;
    badge.textContent = 'New';
    document.body.appendChild(badge);
    await badge.updateComplete;

    expect(badge.hasCustomState('pill')).toBe(true);
    expect(badge.hasCustomState('dot')).toBe(false);
    const base = badge.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('data-variant')).toBe('accent');
    expect(base.getAttribute('data-size')).toBe('lg');
    expect(base.getAttribute('data-pill')).toBe('true');

    badge.dot = true;
    await badge.updateComplete;
    expect(badge.hasCustomState('dot')).toBe(true);
    expect(badge.shadowRoot!.querySelector('[part="label"]')?.hasAttribute('hidden')).toBe(true);
    expect(scanSameRootAria(badge).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-badge variant="success" pill>42</mth-badge>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-badge>', 'hyd-badge>').replaceAll('<mth-badge', '<hyd-badge');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBadge('hyd');
        customElements.upgrade(host);
        await (host as MthBadge).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
