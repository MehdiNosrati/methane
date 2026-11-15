import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { inlineStatusSpec } from './inline-status.spec.js';
import { MthInlineStatus, registerMthInlineStatus } from './index.js';

describe('<mth-inline-status>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and renders semantic live state', async () => {
    const compiled = compileSpec(inlineStatusSpec);
    expect(compiled.docs).toContain('`<mth-inline-status>`');

    const report = await runBehaviorSpecAssertions(inlineStatusSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const status = document.createElement('mth-inline-status') as MthInlineStatus;
    status.variant = 'loading';
    document.body.appendChild(status);
    await status.updateComplete;

    expect(status.hasCustomState('loading')).toBe(true);
    expect(status.shadowRoot?.querySelector('.spinner')).not.toBeNull();
    expect(scanSameRootAria(status).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-inline-status variant="success" label="Saved"></mth-inline-status>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-inline-status', '<hyd-inline-status')
      .replaceAll('</mth-inline-status>', '</hyd-inline-status>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthInlineStatus('hyd');
        customElements.upgrade(host);
        await (host as MthInlineStatus).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
