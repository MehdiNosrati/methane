import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthSkeleton, registerMthSkeleton, skeletonSpec, skeletonStyles } from './index.js';

describe('<mth-skeleton>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders aria-hidden lines without inline style=, and respects reduced motion', async () => {
    const compiled = compileSpec(skeletonSpec);
    expect(compiled.docs).toContain('`<mth-skeleton>`');

    const report = await runBehaviorSpecAssertions(skeletonSpec);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const sk = document.createElement('mth-skeleton') as MthSkeleton;
    sk.variant = 'text';
    sk.lines = 3;
    document.body.appendChild(sk);
    await sk.updateComplete;

    const base = sk.shadowRoot!.querySelector('[part="base"]')!;
    const lines = sk.shadowRoot!.querySelectorAll('[part="line"]');
    expect(base.getAttribute('aria-hidden')).toBe('true');
    expect(lines.length).toBe(3);
    expect(base.hasAttribute('style')).toBe(false);
    expect(sk.hasCustomState('animated')).toBe(true);
    expect(skeletonStyles.cssText).toContain('prefers-reduced-motion: reduce');
    expect(skeletonStyles.cssText).toContain('--mth-skeleton-width');

    sk.variant = 'circular';
    await sk.updateComplete;
    expect(sk.shadowRoot!.querySelectorAll('[part="line"]').length).toBe(1);
    expect(scanSameRootAria(sk).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-skeleton variant="text" lines="2"></mth-skeleton>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');
    expect(rawSsr).not.toContain('style=');

    const ssrHtml = rawSsr
      .replaceAll('mth-skeleton>', 'hyd-skeleton>')
      .replaceAll('<mth-skeleton', '<hyd-skeleton');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSkeleton('hyd');
        customElements.upgrade(host);
        await (host as MthSkeleton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
