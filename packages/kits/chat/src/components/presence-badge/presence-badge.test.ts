import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthPresenceBadge, presenceBadgeSpec, registerMthPresenceBadge } from './index.js';

describe('<mth-presence-badge>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, geometric state differentiation, and same-root ARIA', async () => {
    const compiled = compileSpec(presenceBadgeSpec);
    expect(compiled.tests).toContain('<mth-presence-badge>');
    const report = await runBehaviorSpecAssertions(presenceBadgeSpec, {});
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-presence-badge') as MthPresenceBadge;
    el.status = 'online';
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasCustomState('online')).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="indicator"]')?.getAttribute('data-shape')).toBe('online');
    expect(el.shadowRoot!.querySelector('[part="label"]')?.textContent?.trim()).toBe('Online');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);

    el.status = 'busy';
    await el.updateComplete;
    expect(el.hasCustomState('busy')).toBe(true);
    expect(el.hasCustomState('online')).toBe(false);
    expect(el.shadowRoot!.querySelector('[part="indicator"]')?.getAttribute('data-shape')).toBe('busy');
    expect(el.shadowRoot!.querySelector('[part="label"]')?.textContent?.trim()).toBe('Busy');
  });

  it('provides accessible label when showLabel is false', async () => {
    const el = document.createElement('mth-presence-badge') as MthPresenceBadge;
    el.status = 'away';
    el.showLabel = false;
    document.body.append(el);
    await el.updateComplete;

    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('role')).toBe('status');
    expect(base.getAttribute('aria-label')).toContain('Away');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthPresenceBadge();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-presence-badge status="online"></mth-presence-badge>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-presence-badge>', 'hyd-presence-badge>')
      .replaceAll('<mth-presence-badge', '<hyd-presence-badge');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthPresenceBadge('hyd');
        customElements.upgrade(host);
        await (host as MthPresenceBadge).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
